import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AddGroupMemberDto } from './dto/add-group-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { BulkMessage } from './entities/bulk-message.entity';
import { BulkMessageRequest } from './entities/bulk-message-request.entity';
import { GroupMember } from './entities/group-member.entity';
import { Group } from './entities/group.entity';
import { BulkMessageStatus } from './entities/bulk-message.entity';

/**
 * How much of the typed query the member search needs before it looks anything up. Three
 * characters is short enough to be useful and long enough that the endpoint cannot be walked
 * through the alphabet.
 */
const MIN_MEMBER_SEARCH_LENGTH = 3;

/** How many accounts one search may return. */
const MEMBER_SEARCH_LIMIT = 10;

/**
 * Neutralise the wildcards a typed `%` or `_` would otherwise become. PostgreSQL's LIKE treats
 * backslash as the escape character, so no ESCAPE clause is needed.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** The last four digits of a phone number, or null when none is registered. */
function phoneHint(phone?: string | null): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length > 0 ? digits.slice(-4) : null;
}

/** How an account is named wherever a person reads it: their name, or the login if they have none. */
function displayName(account: {
  fullName?: string | null;
  username: string;
}): string {
  return account.fullName?.trim() || account.username;
}

/**
 * PostgreSQL's code for "a unique constraint was violated", however the driver wrapped it.
 *
 * The check-then-insert in `addMember` cannot be trusted on its own — two requests can pass it at
 * the same moment — so the unique index on (groupId, userId) is what actually decides, and this
 * turns its error into the same 409 the check would have thrown instead of a 500.
 */
function isUniqueViolation(error: unknown): boolean {
  const code =
    (error as { driverError?: { code?: string } })?.driverError?.code ??
    (error as { code?: string })?.code;
  return code === '23505';
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly membersRepository: Repository<GroupMember>,
    @InjectRepository(BulkMessageRequest)
    private readonly requestsRepository: Repository<BulkMessageRequest>,
    @InjectRepository(BulkMessage)
    private readonly messagesRepository: Repository<BulkMessage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateGroupDto) {
    const group = await this.groupsRepository.save(
      this.groupsRepository.create({
        name: dto.name.trim(),
        managerId: userId,
      }),
    );
    return this.toGroupResponse(await this.getOwnedGroup(userId, group.id));
  }

  /**
   * Every group the user may open: the ones they manage, and the ones they belong to.
   *
   * The two steps are deliberate. TypeORM builds a joined relation out of the rows the query
   * returned (RawSqlResultsToEntityTransformer.transform), so a WHERE clause on the joined member
   * alias also filters the members it loads — with a single OR-ed join, a plain member would be
   * shown a group with only themselves in it. Resolving the ids first and then loading the groups
   * keeps every member list complete.
   */
  async listMine(userId: string) {
    const [managed, memberships] = await Promise.all([
      this.groupsRepository.find({
        where: { managerId: userId },
        select: { id: true },
      }),
      this.membersRepository.find({
        where: { userId },
        select: { groupId: true },
      }),
    ]);

    const ids = [
      ...new Set([
        ...managed.map((group) => group.id),
        ...memberships.map((membership) => membership.groupId),
      ]),
    ];
    if (ids.length === 0) return [];

    const groups = await this.groupsRepository.find({
      where: { id: In(ids) },
      relations: { manager: true, members: { user: true } },
      order: { createdAt: 'DESC' },
    });

    // Member phone numbers are for the group's own manager; a plain member sees the list
    // without them.
    return groups.map((group) =>
      this.toGroupResponse(group, group.managerId === userId),
    );
  }

  /**
   * Rename a group: its manager only, and by the same rules as creating one.
   */
  async rename(managerId: string, groupId: string, name: string) {
    await this.getOwnedGroup(managerId, groupId);
    await this.groupsRepository.update(groupId, { name: name.trim() });
    return this.toGroupResponse(await this.getOwnedGroup(managerId, groupId));
  }

  /**
   * Delete a group: its manager only.
   *
   * The memberships go with it — `group_members` cascades — but the delivery history does not. A
   * bulk-message request keeps its rows and its denormalized group name and only loses the link
   * (`groupId` becomes NULL), so whatever the administrator has not sent yet stays in the queue.
   * Deleting a group therefore cannot drop a message that is still waiting to be delivered, which
   * is why no confirmation beyond the caller's own is needed here.
   */
  async remove(managerId: string, groupId: string) {
    await this.getOwnedGroup(managerId, groupId);
    await this.groupsRepository.delete(groupId);
    return { success: true };
  }

  /**
   * Leave a group you were added to.
   *
   * The manager cannot leave: the group would be left with nobody able to change it, and the
   * manager is the one who can delete it instead. Anyone who is not a member is told so rather
   * than silently succeeding, but leaving twice is harmless — the second call simply finds no
   * membership.
   */
  async leave(userId: string, groupId: string) {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('گروه پیدا نشد');
    if (group.managerId === userId) {
      throw new BadRequestException(
        'مدیر گروه نمی‌تواند گروه را ترک کند؛ به‌جای آن گروه را حذف کنید',
      );
    }

    const membership = await this.membersRepository.findOne({
      where: { group: { id: groupId }, user: { id: userId } },
    });
    if (!membership) throw new NotFoundException('شما عضو این گروه نیستید');

    await this.membersRepository.remove(membership);
    return { success: true };
  }

  /**
   * Add an account to a group by user id or by its registered phone number.
   *
   * A name is not accepted here: names are not unique, so the manager picks an account from
   * `searchMemberCandidates` and the id is what arrives. The phone branch stays for clients that
   * already send one.
   */
  async addMember(managerId: string, groupId: string, dto: AddGroupMemberDto) {
    const group = await this.getOwnedGroup(managerId, groupId);

    if (!dto.userId && !dto.phone?.trim()) {
      throw new BadRequestException('شناسه کاربر یا شماره تلفن را وارد کنید');
    }

    const user = dto.userId
      ? await this.usersRepository.findOne({ where: { id: dto.userId } })
      : await this.usersRepository.findOne({
          where: { phone: dto.phone!.trim() },
        });
    if (!user) {
      throw new NotFoundException(
        dto.userId
          ? 'کاربری با این شناسه پیدا نشد'
          : 'کاربری با این شماره تلفن پیدا نشد',
      );
    }

    // The manager and the members are two different sets: the manager runs the group, members are
    // in it. Adding yourself would put you in both, and the group would then send you your own
    // message.
    if (user.id === group.managerId) {
      throw new BadRequestException(
        'شما مدیر این گروه هستید و به‌عنوان عضو ثبت نمی‌شوید',
      );
    }

    const existing = await this.membersRepository.findOne({
      where: { group: { id: groupId }, user: { id: user.id } },
    });
    if (existing) throw new ConflictException('این کاربر از قبل عضو گروه است');

    try {
      await this.membersRepository.save(
        this.membersRepository.create({ group, user }),
      );
    } catch (error) {
      // Two requests at once (a double click, two tabs) both pass the check above; the unique
      // index is what settles it, and it must answer 409 rather than let the violation become a
      // 500.
      if (isUniqueViolation(error)) {
        throw new ConflictException('این کاربر از قبل عضو گروه است');
      }
      throw error;
    }

    return this.toGroupResponse(await this.loadGroup(groupId), true);
  }

  /**
   * Hand the group to one of its members.
   *
   * Without this, a manager's only way out of a group would be to delete it and take everyone's
   * membership with it. The new manager must already be a member — handing a group to someone who
   * is not in it is the invitation question, not a management one — and the outgoing manager is
   * left in the group as an ordinary member, so handing it over does not lock them out of the
   * group they built. They can leave afterwards if they want to.
   *
   * Both sides swap places exactly: the manager is not also a member (see `addMember`, which
   * refuses to put the manager on the member list), so the new manager's membership row goes and
   * the outgoing manager's appears. Without that the group would send its new manager their own
   * message.
   */
  async transfer(managerId: string, groupId: string, userId: string) {
    await this.getOwnedGroup(managerId, groupId);
    if (userId === managerId) {
      throw new BadRequestException('شما همین حالا مدیر این گروه هستید');
    }

    const incomingMembership = await this.membersRepository.findOne({
      where: { group: { id: groupId }, user: { id: userId } },
    });
    if (!incomingMembership) {
      throw new NotFoundException('کاربر انتخابی عضو این گروه نیست');
    }

    const outgoingMembership = await this.membersRepository.findOne({
      where: { group: { id: groupId }, user: { id: managerId } },
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Group, groupId, { managerId: userId });
      await manager.remove(GroupMember, incomingMembership);
      if (!outgoingMembership) {
        await manager.save(
          manager.create(GroupMember, {
            group: { id: groupId },
            user: { id: managerId },
          }),
        );
      }
    });

    // Answered to the manager who just handed it over, who is now an ordinary member of it.
    return this.toGroupResponse(await this.loadGroup(groupId), false);
  }

  /**
   * The accounts a group manager may be looking for, matched by name or by phone number.
   *
   * This is how a member is added by name: a name is not unique, so the manager picks the account
   * rather than the API guessing. Two things keep the search from becoming a member directory —
   * it only answers for a group the caller manages, and it answers with at most
   * MEMBER_SEARCH_LIMIT accounts whose phone numbers are reduced to their last four digits. That
   * is enough to recognise the person the manager had in mind and not enough to harvest numbers
   * they never knew.
   *
   * A query shorter than MIN_MEMBER_SEARCH_LENGTH returns nothing at all, so the endpoint cannot
   * be walked one character at a time.
   */
  async searchMemberCandidates(
    managerId: string,
    groupId: string,
    query: string,
  ) {
    const group = await this.getOwnedGroup(managerId, groupId);
    const term = (query ?? '').trim();
    if (term.length < MIN_MEMBER_SEARCH_LENGTH) return [];

    const like = `%${escapeLike(term)}%`;
    const digits = term.replace(/\D/g, '');

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.fullName', 'user.phone'])
      .where(
        new Brackets((where) => {
          where
            .where('user.username ILIKE :like', { like })
            .orWhere('user.fullName ILIKE :like', { like });
          // A phone number typed without its separators still finds the account: "0912 345"
          // and "0912345" are the same search.
          if (digits.length >= MIN_MEMBER_SEARCH_LENGTH) {
            where.orWhere('user.phone ILIKE :digits', {
              digits: `%${digits}%`,
            });
          }
        }),
      )
      .orderBy('user.username', 'ASC')
      .limit(MEMBER_SEARCH_LIMIT)
      .getMany();

    // Accounts that are already in the group are still listed, marked as members: a manager who
    // searches for someone they already added should see why the result looks the way it does.
    const memberIds = new Set(group.members.map((member) => member.userId));

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName ?? null,
      phoneHint: phoneHint(user.phone),
      alreadyMember: memberIds.has(user.id),
    }));
  }

  async removeMember(managerId: string, groupId: string, userId: string) {
    await this.getOwnedGroup(managerId, groupId);
    const member = await this.membersRepository.findOne({
      where: { group: { id: groupId }, user: { id: userId } },
    });
    if (!member) throw new NotFoundException('عضو گروه پیدا نشد');
    await this.membersRepository.remove(member);
    return this.toGroupResponse(await this.getOwnedGroup(managerId, groupId));
  }

  async createBulkMessage(managerId: string, groupId: string, content: string) {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId, managerId },
      relations: { manager: true, members: { user: true } },
    });
    if (!group) throw new NotFoundException('گروه پیدا نشد');
    if (group.members.length === 0) {
      throw new BadRequestException(
        'برای ارسال پیام، گروه باید عضو داشته باشد',
      );
    }
    const membersWithoutPhone = group.members.filter(
      (membership) => !membership.user.phone?.trim(),
    );
    if (membersWithoutPhone.length > 0) {
      throw new BadRequestException(
        'برای همه اعضای گروه باید شماره تلفن ثبت شده باشد',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const request = await manager.save(
        BulkMessageRequest,
        manager.create(BulkMessageRequest, {
          groupId,
          groupName: group.name,
          requestedById: managerId,
          requestedByName: displayName(group.manager),
          content: content.trim(),
        }),
      );
      const messages = group.members.map((membership) =>
        manager.create(BulkMessage, {
          requestId: request.id,
          // Every member has a number by now — the check above rejects the request otherwise —
          // so the fallback only keeps the nullable column honest.
          phone: membership.user.phone?.trim() ?? '',
          content: content.trim(),
        }),
      );
      await manager.save(BulkMessage, messages);
      return { id: request.id, recipientCount: messages.length };
    });
  }

  async listBulkMessages() {
    const requests = await this.requestsRepository.find({
      relations: { messages: true },
      order: { createdAt: 'DESC' },
    });
    return requests.map((request) => ({
      id: request.id,
      groupName: request.groupName,
      requestedBy: request.requestedByName,
      content: request.content,
      createdAt: request.createdAt,
      messages: request.messages
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((message) => ({
          id: message.id,
          phone: message.phone,
          content: message.content,
          status: message.status,
          sentAt: message.sentAt,
        })),
    }));
  }

  async markSent(messageId: string) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('پیام پیدا نشد');
    if (message.sentAt) return message;
    message.status = BulkMessageStatus.SENT;
    message.sentAt = new Date();
    return this.messagesRepository.save(message);
  }

  /**
   * The group with everything a response needs, or a 404.
   *
   * Every mutation ends by returning the group as it now stands, so this is the one place that
   * decides what "the group" means: its manager and its members with their accounts.
   */
  private async loadGroup(groupId: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: { manager: true, members: { user: true } },
    });
    if (!group) throw new NotFoundException('گروه پیدا نشد');
    return group;
  }

  /**
   * The same, but only if this user manages it — the one check every change to a group goes
   * through: its members, its name, its manager, and deleting it.
   */
  private async getOwnedGroup(managerId: string, groupId: string) {
    const group = await this.loadGroup(groupId);
    if (group.managerId !== managerId) {
      throw new ForbiddenException(
        'فقط مدیر گروه می‌تواند این گروه را تغییر دهد',
      );
    }
    return group;
  }

  /**
   * A group as the API returns it.
   *
   * `isManager` says what the caller may do with it, and decides whether member phone numbers come
   * with it: those are for the group's own manager, and everyone else — including a plain member —
   * gets `null` instead. The client reads the flag rather than comparing `managerId` with a user it
   * may not have loaded yet.
   */
  private toGroupResponse(group: Group, isManager = true) {
    return {
      id: group.id,
      name: group.name,
      managerId: group.managerId,
      managerName: displayName(group.manager),
      isManager,
      createdAt: group.createdAt,
      members: (group.members ?? [])
        .map((membership) => ({
          id: membership.user.id,
          username: membership.user.username,
          fullName: membership.user.fullName ?? null,
          phone: isManager ? (membership.user.phone ?? null) : null,
        }))
        // Sorted here rather than in the client, so every caller sees the same order and a group
        // does not appear to reshuffle itself between requests.
        .sort((a, b) => displayName(a).localeCompare(displayName(b), 'fa')),
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
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
      this.groupsRepository.create({ name: dto.name.trim(), managerId: userId }),
    );
    return this.toGroupResponse(await this.getOwnedGroup(userId, group.id));
  }

  async listMine(userId: string) {
    const groups = await this.groupsRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.manager', 'manager')
      .leftJoinAndSelect('group.members', 'membership')
      .leftJoinAndSelect('membership.user', 'member')
      .where('group.managerId = :userId', { userId })
      .orWhere('member.id = :userId', { userId })
      .orderBy('group.createdAt', 'DESC')
      .getMany();
    // Member phone numbers are for the group's own manager; a plain member sees the list
    // without them.
    return groups.map((group) =>
      this.toGroupResponse(group, group.managerId === userId),
    );
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

    const existing = await this.membersRepository.findOne({
      where: { group: { id: groupId }, user: { id: user.id } },
    });
    if (existing) throw new ConflictException('این کاربر از قبل عضو گروه است');

    await this.membersRepository.save(
      this.membersRepository.create({ group, user }),
    );
    return this.toGroupResponse(await this.getOwnedGroup(managerId, groupId));
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
      throw new BadRequestException('برای ارسال پیام، گروه باید عضو داشته باشد');
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
          requestedByName: group.manager.fullName || group.manager.username,
          content: content.trim(),
        }),
      );
      const messages = group.members.map((membership) =>
        manager.create(BulkMessage, {
          requestId: request.id,
          phone: membership.user.phone!.trim(),
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

  private async getOwnedGroup(managerId: string, groupId: string) {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: { manager: true, members: { user: true } },
    });
    if (!group) throw new NotFoundException('گروه پیدا نشد');
    if (group.managerId !== managerId) {
      throw new ForbiddenException('فقط مدیر گروه می‌تواند اعضا را تغییر دهد');
    }
    return group;
  }

  private toGroupResponse(group: Group, includeMemberPhones = true) {
    return {
      id: group.id,
      name: group.name,
      managerId: group.managerId,
      managerName: group.manager.fullName || group.manager.username,
      createdAt: group.createdAt,
      members: (group.members ?? []).map((membership) => ({
        id: membership.user.id,
        username: membership.user.username,
        fullName: membership.user.fullName ?? null,
        phone: includeMemberPhones ? (membership.user.phone ?? null) : null,
      })),
    };
  }
}

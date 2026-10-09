import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { BulkMessage } from './entities/bulk-message.entity';
import { BulkMessageRequest } from './entities/bulk-message-request.entity';
import { GroupMember } from './entities/group-member.entity';
import { Group } from './entities/group.entity';
import { BulkMessageStatus } from './entities/bulk-message.entity';

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
      this.groupsRepository.create({ name: dto.name.trim(), leaderId: userId }),
    );
    return this.toGroupResponse(await this.getOwnedGroup(userId, group.id));
  }

  async listMine(userId: string) {
    const groups = await this.groupsRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.leader', 'leader')
      .leftJoinAndSelect('group.members', 'membership')
      .leftJoinAndSelect('membership.user', 'member')
      .where('group.leaderId = :userId', { userId })
      .orWhere('member.id = :userId', { userId })
      .orderBy('group.createdAt', 'DESC')
      .getMany();
    return groups.map((group) =>
      this.toGroupResponse(group, group.leaderId === userId),
    );
  }

  async addMember(leaderId: string, groupId: string, phone: string) {
    const group = await this.getOwnedGroup(leaderId, groupId);
    const user = await this.usersRepository.findOne({
      where: { phone: phone.trim() },
    });
    if (!user) {
      throw new NotFoundException('کاربری با این شماره تلفن پیدا نشد');
    }
    const existing = await this.membersRepository.findOne({
      where: { group: { id: groupId }, user: { id: user.id } },
    });
    if (existing) throw new ConflictException('این کاربر از قبل عضو گروه است');

    await this.membersRepository.save(
      this.membersRepository.create({ group, user }),
    );
    return this.toGroupResponse(await this.getOwnedGroup(leaderId, groupId));
  }

  async removeMember(leaderId: string, groupId: string, userId: string) {
    await this.getOwnedGroup(leaderId, groupId);
    const member = await this.membersRepository.findOne({
      where: { group: { id: groupId }, user: { id: userId } },
    });
    if (!member) throw new NotFoundException('عضو گروه پیدا نشد');
    await this.membersRepository.remove(member);
    return this.toGroupResponse(await this.getOwnedGroup(leaderId, groupId));
  }

  async createBulkMessage(leaderId: string, groupId: string, content: string) {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId, leaderId },
      relations: { leader: true, members: { user: true } },
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
          requestedById: leaderId,
          requestedByName: group.leader.fullName || group.leader.username,
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

  private async getOwnedGroup(leaderId: string, groupId: string) {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: { leader: true, members: { user: true } },
    });
    if (!group) throw new NotFoundException('گروه پیدا نشد');
    if (group.leaderId !== leaderId) {
      throw new ForbiddenException('فقط مدیر گروه می‌تواند اعضا را تغییر دهد');
    }
    return group;
  }

  private toGroupResponse(group: Group, includeMemberPhones = true) {
    return {
      id: group.id,
      name: group.name,
      leaderId: group.leaderId,
      leaderName: group.leader.fullName || group.leader.username,
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

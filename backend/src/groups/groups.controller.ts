import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { MANAGEMENT_ROLES } from '../auth/role-sets';
import { RolesGuard } from '../auth/roles.guard';
import { AddGroupMemberDto } from './dto/add-group-member.dto';
import { CreateBulkMessageDto } from './dto/create-bulk-message.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { MemberSearchQueryDto } from './dto/member-search-query.dto';
import { TransferGroupDto } from './dto/transfer-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';

interface RequestWithUser extends Request {
  user: { userId: string };
}

/**
 * Groups, and the one rule that decides everything here: a group is changed by the user in its
 * `managerId`, whatever their role — and an account becomes a group's manager by creating it. So
 * these routes have no `@Roles`: a plain USER who runs a group may rename it, fill it, use it, hand
 * it over and delete it. The delivery queue at the bottom is the exception, and it is a management
 * tool rather than a group one.
 *
 * Every `:id` is a uuid and is parsed as one, so a malformed path is a 400 rather than a database
 * error wearing a 500.
 */
@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  /** Every group the caller manages or belongs to. */
  @Get('my')
  listMine(@Req() req: RequestWithUser) {
    return this.groupsService.listMine(req.user.userId);
  }

  /** Create one. The caller becomes its manager. */
  @Post()
  create(@Req() req: RequestWithUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(req.user.userId, dto);
  }

  /** Rename. The group's manager only; the same body as creating one. */
  @Patch(':id')
  rename(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.rename(req.user.userId, groupId, dto.name);
  }

  /** Delete. The group's manager only; messages already queued for delivery survive it. */
  @Delete(':id')
  remove(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) groupId: string,
  ) {
    return this.groupsService.remove(req.user.userId, groupId);
  }

  /** Hand the group to one of its members, so a manager has a way out that is not deletion. */
  @Post(':id/manager')
  transfer(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: TransferGroupDto,
  ) {
    return this.groupsService.transfer(req.user.userId, groupId, dto.userId);
  }

  /** Add a member, by user id (what the picker sends) or by registered phone number. */
  @Post(':id/members')
  addMember(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: AddGroupMemberDto,
  ) {
    return this.groupsService.addMember(req.user.userId, groupId, dto);
  }

  /**
   * The accounts the group's manager may add, found by name or by phone number.
   *
   * It is what makes adding a member by name possible without the API having to guess which
   * "علی رضایی" was meant: the manager picks from the result and adds by id. See
   * GroupsService.searchMemberCandidates for what the search will and will not reveal.
   */
  @Get(':id/member-candidates')
  searchMemberCandidates(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Query() query: MemberSearchQueryDto,
  ) {
    return this.groupsService.searchMemberCandidates(
      req.user.userId,
      groupId,
      query.q ?? '',
    );
  }

  /**
   * Leave a group you were added to. Declared before `:userId`, which would otherwise swallow
   * "me" and look for a member with that id.
   */
  @Delete(':id/members/me')
  leave(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) groupId: string,
  ) {
    return this.groupsService.leave(req.user.userId, groupId);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.groupsService.removeMember(req.user.userId, groupId, userId);
  }

  /** Submit one message for every member; it lands in the delivery queue below. */
  @Post(':id/messages')
  createBulkMessage(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateBulkMessageDto,
  ) {
    return this.groupsService.createBulkMessage(
      req.user.userId,
      groupId,
      dto.content,
    );
  }

  /** The copy-and-paste delivery queue: administrators and managers both work through it. */
  @Get('admin/bulk-messages')
  @Roles(...MANAGEMENT_ROLES)
  listBulkMessages() {
    return this.groupsService.listBulkMessages();
  }

  @Patch('admin/bulk-messages/:messageId/sent')
  @Roles(...MANAGEMENT_ROLES)
  markSent(@Param('messageId', ParseUUIDPipe) messageId: string) {
    return this.groupsService.markSent(messageId);
  }
}

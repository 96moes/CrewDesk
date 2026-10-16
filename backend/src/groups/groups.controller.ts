import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { GroupsService } from './groups.service';

interface RequestWithUser extends Request {
  user: { userId: string };
}

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get('my')
  listMine(@Req() req: RequestWithUser) {
    return this.groupsService.listMine(req.user.userId);
  }

  @Post()
  create(@Req() req: RequestWithUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(req.user.userId, dto);
  }

  @Post(':id/members')
  addMember(
    @Req() req: RequestWithUser,
    @Param('id') groupId: string,
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
    @Param('id') groupId: string,
    @Query('q') query: string,
  ) {
    return this.groupsService.searchMemberCandidates(
      req.user.userId,
      groupId,
      query,
    );
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Req() req: RequestWithUser,
    @Param('id') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.groupsService.removeMember(req.user.userId, groupId, userId);
  }

  @Post(':id/messages')
  createBulkMessage(
    @Req() req: RequestWithUser,
    @Param('id') groupId: string,
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
  markSent(@Param('messageId') messageId: string) {
    return this.groupsService.markSent(messageId);
  }
}

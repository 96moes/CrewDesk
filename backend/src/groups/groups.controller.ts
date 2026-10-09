import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
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
    return this.groupsService.addMember(req.user.userId, groupId, dto.phone);
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

  @Get('admin/bulk-messages')
  @Roles(UserRole.ADMIN)
  listBulkMessages() {
    return this.groupsService.listBulkMessages();
  }

  @Patch('admin/bulk-messages/:messageId/sent')
  @Roles(UserRole.ADMIN)
  markSent(@Param('messageId') messageId: string) {
    return this.groupsService.markSent(messageId);
  }
}

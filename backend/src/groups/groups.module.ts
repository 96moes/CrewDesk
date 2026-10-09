import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { BulkMessageRequest } from './entities/bulk-message-request.entity';
import { BulkMessage } from './entities/bulk-message.entity';
import { User } from '../users/entities/user.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      BulkMessageRequest,
      BulkMessage,
      User,
    ]),
    AuthModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}

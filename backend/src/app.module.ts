// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SocialLinksModule } from './social-links/social-links.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { User } from './users/entities/user.entity';
import { SocialLink } from './social-links/entities/social-link.entity';
import { Project } from './projects/entities/project.entity';
import { Task } from './tasks/entities/task.entity';
import { GroupsModule } from './groups/groups.module';
import { Group } from './groups/entities/group.entity';
import { GroupMember } from './groups/entities/group-member.entity';
import { BulkMessageRequest } from './groups/entities/bulk-message-request.entity';
import { BulkMessage } from './groups/entities/bulk-message.entity';
import { MediaModule } from './media/media.module';
import { Media } from './media/entities/media.entity';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { Opportunity } from './opportunities/entities/opportunity.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'your_password'),
        database: configService.get('DB_DATABASE', 'your_database_name'),
        entities: [
          User,
          SocialLink,
          Project,
          Task,
          Group,
          GroupMember,
          BulkMessageRequest,
          BulkMessage,
          Media,
          Opportunity,
        ],
        autoLoadEntities: true,
        synchronize: true, // ⚠️ dev only
      }),
    }),
    AuthModule,
    UsersModule,
    SocialLinksModule,
    ProjectsModule,
    TasksModule,
    GroupsModule,
    MediaModule,
    OpportunitiesModule,
  ],
})
export class AppModule {}

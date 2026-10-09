import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialLinksController } from './social-links.controller';
import { SocialLinksService } from './social-links.service';
import { SocialLink } from './entities/social-link.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SocialLink]), AuthModule],
  controllers: [SocialLinksController],
  providers: [SocialLinksService],
  exports: [SocialLinksService],
})
export class SocialLinksModule {}

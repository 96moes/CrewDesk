// src/media/media.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MANAGEMENT_ROLES } from '../auth/role-sets';

/**
 * Gallery content.
 *
 * `GET /media` is intentionally public: the gallery is a public page and must render for
 * anonymous visitors and for crawlers. Everything that writes is open to the management roles
 * (administrator and manager), and the admin listing (which includes unpublished drafts) is a
 * separate, guarded route.
 */
@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /** Public gallery feed. */
  @Get()
  findPublic() {
    return this.mediaService.findPublic();
  }

  /** Admin listing, including unpublished items. Must be declared before `:id`. */
  @ApiBearerAuth()
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  findAll() {
    return this.mediaService.findAll();
  }

  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  create(@Body() dto: CreateMediaDto) {
    return this.mediaService.create(dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}

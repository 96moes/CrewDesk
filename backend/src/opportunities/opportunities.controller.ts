// src/opportunities/opportunities.controller.ts
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
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MANAGEMENT_ROLES } from '../auth/role-sets';

/**
 * Cooperation opportunities — the cards on the public «فرصت‌های همکاری» page.
 *
 * `GET /opportunities` is intentionally public: the page is open to anonymous visitors and
 * must render for crawlers. Everything that writes is open to the management roles
 * (administrator and manager), and the panel listing (which includes drafts) is a separate,
 * guarded route.
 */
@ApiTags('opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  /** Public feed for the cooperation page. */
  @Get()
  findPublic() {
    return this.opportunitiesService.findPublic();
  }

  /** Admin listing, including unpublished items. Must be declared before `:id`. */
  @ApiBearerAuth()
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  findAll() {
    return this.opportunitiesService.findAll();
  }

  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  findOne(@Param('id') id: string) {
    return this.opportunitiesService.findOne(id);
  }

  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  create(@Body() dto: CreateOpportunityDto) {
    return this.opportunitiesService.create(dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.opportunitiesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  remove(@Param('id') id: string) {
    return this.opportunitiesService.remove(id);
  }
}

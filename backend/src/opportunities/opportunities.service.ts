// src/opportunities/opportunities.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity } from './entities/opportunity.entity';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly opportunitiesRepository: Repository<Opportunity>,
  ) {}

  /**
   * Public list for the «فرصت‌های همکاری» page.
   *
   * `published` is filtered in SQL rather than in the client, so a draft can never leak to
   * an anonymous visitor.
   */
  async findPublic(): Promise<Opportunity[]> {
    return this.opportunitiesRepository.find({
      where: { published: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /** Admin listing: includes unpublished items. */
  async findAll(): Promise<Opportunity[]> {
    return this.opportunitiesRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Opportunity> {
    const opportunity = await this.opportunitiesRepository.findOne({
      where: { id },
    });
    if (!opportunity) throw new NotFoundException('Opportunity not found');
    return opportunity;
  }

  async create(dto: CreateOpportunityDto): Promise<Opportunity> {
    const opportunity = this.opportunitiesRepository.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      actionLabel: dto.actionLabel?.trim() || null,
      actionUrl: dto.actionUrl?.trim() || null,
      sortOrder: dto.sortOrder ?? 0,
      published: dto.published ?? true,
    });

    return this.opportunitiesRepository.save(opportunity);
  }

  async update(id: string, dto: UpdateOpportunityDto): Promise<Opportunity> {
    const opportunity = await this.findOne(id);

    if (dto.title !== undefined) opportunity.title = dto.title.trim();
    if (dto.description !== undefined) {
      opportunity.description = dto.description?.trim() || null;
    }
    if (dto.actionLabel !== undefined) {
      opportunity.actionLabel = dto.actionLabel?.trim() || null;
    }
    if (dto.actionUrl !== undefined) {
      opportunity.actionUrl = dto.actionUrl?.trim() || null;
    }
    if (dto.sortOrder !== undefined) opportunity.sortOrder = dto.sortOrder;
    if (dto.published !== undefined) opportunity.published = dto.published;

    return this.opportunitiesRepository.save(opportunity);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const opportunity = await this.findOne(id);
    await this.opportunitiesRepository.remove(opportunity);
    return { success: true };
  }
}

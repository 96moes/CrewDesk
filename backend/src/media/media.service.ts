// src/media/media.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media, MediaKind } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { parseVideoUrl, SUPPORTED_VIDEO_HOSTS } from './utils/video-url';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  /**
   * Public gallery.
   *
   * `published` is filtered in SQL rather than in the client, so an unpublished item can
   * never leak to an anonymous visitor.
   */
  async findPublic(): Promise<Media[]> {
    return this.mediaRepository.find({
      where: { published: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /** Admin listing: includes unpublished items. */
  async findAll(): Promise<Media[]> {
    return this.mediaRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Media> {
    const item = await this.mediaRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Media item not found');
    return item;
  }

  async create(dto: CreateMediaDto): Promise<Media> {
    const item = this.mediaRepository.create({
      title: dto.title.trim(),
      kind: dto.kind,
      url: dto.url.trim(),
      description: dto.description?.trim() || null,
      linkUrl: dto.linkUrl?.trim() || null,
      thumbnailUrl: dto.thumbnailUrl?.trim() || null,
      sortOrder: dto.sortOrder ?? 0,
      published: dto.published ?? true,
      embedUrl: null,
    });

    this.applyVideoDerivation(item);
    return this.mediaRepository.save(item);
  }

  async update(id: string, dto: UpdateMediaDto): Promise<Media> {
    const item = await this.findOne(id);

    if (dto.title !== undefined) item.title = dto.title.trim();
    if (dto.kind !== undefined) item.kind = dto.kind;
    if (dto.url !== undefined) item.url = dto.url.trim();
    if (dto.description !== undefined) {
      item.description = dto.description?.trim() || null;
    }
    if (dto.linkUrl !== undefined) item.linkUrl = dto.linkUrl?.trim() || null;
    if (dto.thumbnailUrl !== undefined) {
      item.thumbnailUrl = dto.thumbnailUrl?.trim() || null;
    }
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    if (dto.published !== undefined) item.published = dto.published;

    // Re-derive whenever the kind or URL changed; also clears stale embed data when an
    // item is switched from video to photo.
    this.applyVideoDerivation(item);

    return this.mediaRepository.save(item);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const item = await this.findOne(id);
    await this.mediaRepository.remove(item);
    return { success: true };
  }

  /**
   * Fills in `embedUrl` (and a thumbnail when the provider offers one).
   *
   * A video URL that no provider recognises is rejected instead of being stored: the
   * gallery would otherwise render a dead player that looks like a bug to visitors.
   */
  private applyVideoDerivation(item: Media): void {
    if (item.kind !== MediaKind.VIDEO) {
      item.embedUrl = null;
      return;
    }

    const parsed = parseVideoUrl(item.url);
    if (!parsed) {
      throw new BadRequestException(
        `Unsupported video URL. Supported hosts: ${SUPPORTED_VIDEO_HOSTS.join(', ')}`,
      );
    }

    item.embedUrl = parsed.embedUrl;
    // An admin-supplied thumbnail wins over the provider default.
    if (!item.thumbnailUrl && parsed.thumbnailUrl) {
      item.thumbnailUrl = parsed.thumbnailUrl;
    }
  }
}

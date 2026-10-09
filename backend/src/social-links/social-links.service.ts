import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialLink, SocialPlatform } from './entities/social-link.entity';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';

@Injectable()
export class SocialLinksService {
  constructor(
    @InjectRepository(SocialLink)
    private socialLinkRepository: Repository<SocialLink>,
  ) {}

  async getLinks(): Promise<SocialLink[]> {
    return this.socialLinkRepository.find();
  }

  async updateLinks(dto: UpdateSocialLinksDto): Promise<SocialLink[]> {
    // 1. Fetch existing links
    const existing = await this.socialLinkRepository.find();
    const existingMap = new Map<string, SocialLink>();
    existing.forEach((link) => existingMap.set(link.platform, link));

    const linksToSave: SocialLink[] = [];
    const platformMap: Record<string, SocialPlatform> = {
      instagram: SocialPlatform.INSTAGRAM,
      telegram: SocialPlatform.TELEGRAM,
      bale: SocialPlatform.BALE,
      eita: SocialPlatform.EITA,
      youtube: SocialPlatform.YOUTUBE,
      rubika: SocialPlatform.RUBIKA,
      aparat: SocialPlatform.APARAT,
      adminEita: SocialPlatform.ADMIN_EITA,
      adminBale: SocialPlatform.ADMIN_BALE,
    };

    // 2. Process each field from the DTO
    for (const [key, value] of Object.entries(dto)) {
      const platform = platformMap[key];
      if (!platform) continue; // ignore unknown keys

      // If value is undefined/null → leave unchanged (skip)
      if (value === undefined || value === null) continue;

      const trimmed = value.trim();

      // If value is empty string → delete this platform
      if (trimmed === '') {
        const existingLink = existingMap.get(platform);
        if (existingLink) {
          await this.socialLinkRepository.delete(existingLink.id);
          existingMap.delete(platform); // remove from map
        }
        continue;
      }

      // 3. Upsert: update existing or create new
      let link = existingMap.get(platform);
      if (!link) {
        link = new SocialLink();
        link.platform = platform;
      }
      link.url = trimmed;
      linksToSave.push(link);
    }

    // 4. Save all upserts
    if (linksToSave.length > 0) {
      await this.socialLinkRepository.save(linksToSave);
    }

    // 5. Return the full updated list
    return this.socialLinkRepository.find();
  }
}

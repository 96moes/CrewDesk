// src/media/dto/create-media.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaKind } from '../entities/media.entity';

export class CreateMediaDto {
  @ApiProperty({ example: 'مراسم افتتاحیه' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: MediaKind, example: MediaKind.PHOTO })
  @IsEnum(MediaKind)
  kind: MediaKind;

  @ApiProperty({
    description:
      'Photo: a direct image URL. Video: an Aparat or YouTube page URL (the player URL is derived).',
    example: 'https://www.aparat.com/v/abc123',
  })
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'url must be a valid URL' })
  url: string;

  @ApiPropertyOptional({ example: 'گزارش کوتاه از رویداد' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional preview image. Derived automatically for YouTube.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false }, { message: 'thumbnailUrl must be a valid URL' })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({
    description: 'When set, the item links here instead of playing inline.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false }, { message: 'linkUrl must be a valid URL' })
  linkUrl?: string | null;

  @ApiPropertyOptional({ default: 0, description: 'Lower sorts first.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

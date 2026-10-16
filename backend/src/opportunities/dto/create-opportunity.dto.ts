// src/opportunities/dto/create-opportunity.dto.ts
import {
  IsBoolean,
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

export class CreateOpportunityDto {
  @ApiProperty({ example: 'همکاری داوطلبانه' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'پیوستن به تیم داوطلبان قوم سلمان در رویدادها و برنامه‌های فرهنگی.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'درخواست همکاری',
    description: 'Call-to-action button text. Defaults to «درخواست همکاری» in the page.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  actionLabel?: string;

  @ApiPropertyOptional({
    example: 'https://t.me/example',
    description: 'Where the button points. Empty falls back to the sign-up form.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false }, { message: 'actionUrl must be a valid URL' })
  actionUrl?: string | null;

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

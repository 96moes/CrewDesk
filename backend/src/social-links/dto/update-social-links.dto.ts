import { IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSocialLinksDto {
  @ApiPropertyOptional({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/company',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Instagram must be a valid URL' })
  instagram?: string;

  @ApiPropertyOptional({
    description: 'Telegram channel URL',
    example: 'https://t.me/company',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Telegram must be a valid URL' })
  telegram?: string;

  @ApiPropertyOptional({
    description: 'Bale profile URL',
    example: 'https://bale.ai/company',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Bale must be a valid URL' })
  bale?: string;

  @ApiPropertyOptional({
    description: 'Eita profile URL',
    example: 'https://eita.com/company',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Eita must be a valid URL' })
  eita?: string;

  @ApiPropertyOptional({
    description: 'YouTube channel URL',
    example: 'https://youtube.com/@company',
  })
  @IsOptional()
  @IsUrl({}, { message: 'YouTube must be a valid URL' })
  youtube?: string;

  @ApiPropertyOptional({
    description: 'Rubika profile URL',
    example: 'https://rubika.ir/company',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Rubika must be a valid URL' })
  rubika?: string;

  @ApiPropertyOptional({
    description: 'Aparat profile URL',
    example: 'https://aparat.com/company',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Aparat must be a valid URL' })
  aparat?: string;

  @ApiPropertyOptional({
    description: 'Admin Eita profile URL',
    example: 'https://eita.com/admin-company',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Admin Eita must be a valid URL' })
  adminEita?: string;

  @ApiPropertyOptional({
    description: 'Admin Bale profile URL',
    example: 'https://bale.ai/admin-company',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Admin Bale must be a valid URL' })
  adminBale?: string;
}

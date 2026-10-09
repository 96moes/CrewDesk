import { ApiProperty } from '@nestjs/swagger';
import { SocialLink } from '../entities/social-link.entity';

export class SocialLinksResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    type: [SocialLink],
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        platform: 'instagram',
        url: 'https://instagram.com/company',
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        platform: 'telegram',
        url: 'https://t.me/company',
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        platform: 'youtube',
        url: 'https://youtube.com/@company',
      },
    ],
    description: 'List of social links',
  })
  data: SocialLink[];
}

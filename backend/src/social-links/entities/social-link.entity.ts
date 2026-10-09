import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  TELEGRAM = 'telegram',
  BALE = 'bale',
  EITA = 'eita',
  YOUTUBE = 'youtube',
  RUBIKA = 'rubika',
  APARAT = 'aparat',
  ADMIN_EITA = 'adminEita',
  ADMIN_BALE = 'adminBale',
}

@Entity('social_links')
export class SocialLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SocialPlatform,
  })
  platform: SocialPlatform;

  @Column({ type: 'text' })
  url: string;
}

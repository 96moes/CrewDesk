import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MediaKind {
  PHOTO = 'photo',
  VIDEO = 'video',
}

/**
 * A single item in the public gallery.
 *
 * Media is referenced by URL rather than uploaded: the realistic sources for this site are
 * Aparat/YouTube links and images already hosted elsewhere, and file uploads would add
 * storage, cleanup and serving concerns that the deployment does not currently have.
 */
@Entity('media_items')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'enum', enum: MediaKind })
  kind: MediaKind;

  @Column({ type: 'text' })
  url: string;

  /**
   * For videos: the normalised, safe-to-embed player URL, derived from `url` on save.
   * Null for photos or for a video URL whose host is not recognised.
   */
  @Column({ type: 'text', nullable: true })
  embedUrl: string | null;

  /** Preview image. Derived from the provider for YouTube, or supplied by an admin. */
  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string | null;

  /** Optional caption shown under the item. */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * When set, the gallery renders the item as a plain link instead of an inline
   * player/figure — useful for pointing at a full album or an external gallery.
   */
  @Column({ type: 'text', nullable: true })
  linkUrl: string | null;

  /** Lower sorts first; ties fall back to newest first. */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  /** Unpublished items are hidden from the public list but kept for later. */
  @Column({ type: 'boolean', default: true })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

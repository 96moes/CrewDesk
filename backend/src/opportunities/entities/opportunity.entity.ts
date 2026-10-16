// src/opportunities/entities/opportunity.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One way a visitor can cooperate with the organisation — the cards on the public
 * «فرصت‌های همکاری» page.
 *
 * The content used to live in a `const OPPORTUNITIES` array inside the page component, which
 * meant every wording change was a deploy. It now lives here, is served by
 * `GET /opportunities` and is edited from the management panel like the gallery and the
 * projects.
 */
@Entity('cooperation_opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Call-to-action button text. Falls back to «درخواست همکاری» in the page when empty. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  actionLabel: string | null;

  /**
   * Where the call-to-action button points. When empty the page sends the visitor to the
   * sign-up form, which is the only in-app way to offer to help.
   */
  @Column({ type: 'text', nullable: true })
  actionUrl: string | null;

  /** Lower sorts first; ties fall back to oldest first, i.e. the order they were added. */
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

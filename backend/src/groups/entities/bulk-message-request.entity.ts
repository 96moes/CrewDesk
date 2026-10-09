import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';
import { BulkMessage } from './bulk-message.entity';

@Entity('bulk_message_requests')
export class BulkMessageRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  groupId!: string | null;

  @Column()
  groupName!: string;

  @ManyToOne(() => Group, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'groupId' })
  group!: Group | null;

  @Column({ type: 'uuid', nullable: true })
  requestedById!: string | null;

  @Column()
  requestedByName!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requestedById' })
  requestedBy!: User | null;

  @Column({ type: 'text' })
  content!: string;

  @OneToMany(() => BulkMessage, (message) => message.request, {
    cascade: true,
  })
  messages!: BulkMessage[];

  @CreateDateColumn()
  createdAt!: Date;
}

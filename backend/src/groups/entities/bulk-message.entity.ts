import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { BulkMessageRequest } from './bulk-message-request.entity';

export enum BulkMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
}

@Entity('bulk_messages')
export class BulkMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  requestId!: string;

  @ManyToOne(() => BulkMessageRequest, (request) => request.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requestId' })
  request!: BulkMessageRequest;

  @Column()
  phone!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: BulkMessageStatus,
    default: BulkMessageStatus.PENDING,
  })
  status!: BulkMessageStatus;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}

// src/projects/entities/project.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DONE = 'done',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status!: ProjectStatus;

  @Column({ type: 'uuid', nullable: true })
  managerId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'managerId' })
  manager?: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}

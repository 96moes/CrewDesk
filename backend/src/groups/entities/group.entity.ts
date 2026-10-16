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
import { GroupMember } from './group-member.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  /** The user who manages this group: only they may change its members or post for it. */
  @Column({ type: 'uuid' })
  managerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'managerId' })
  manager!: User;

  @OneToMany(() => GroupMember, (member) => member.group)
  members!: GroupMember[];

  @CreateDateColumn()
  createdAt!: Date;
}

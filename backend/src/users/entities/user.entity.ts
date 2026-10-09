// src/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum UserRole {
  REGISTRAR = 'REGISTRAR',
  REPORT_VIEWER = 'REPORT_VIEWER',
  ADMIN = 'ADMIN',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string; // hashed

  @Column({ type: 'enum', enum: UserRole, default: UserRole.REGISTRAR })
  role!: UserRole;

  // -------- New optional profile fields --------
  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true, unique: true })
  phone?: string;

  // Self-referencing manager (who this user reports to)
  @Column({ type: 'uuid', nullable: true })
  managerId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'managerId' })
  manager?: User | null;
}

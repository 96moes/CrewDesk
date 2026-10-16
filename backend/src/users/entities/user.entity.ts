// src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { GroupMember } from '../../groups/entities/group-member.entity';

/**
 * Who an account belongs to.
 *
 * Three roles:
 *
 *   USER     every ordinary account holder.
 *   MANAGER  runs the site content like an administrator — projects, tasks, media, the
 *            social links and the bulk-message queue — but has no access to user accounts.
 *            User management is the whole of the difference: see MANAGEMENT_ROLES in
 *            src/auth/role-sets.ts and the @Roles(UserRole.ADMIN)-only routes in
 *            src/users/users.controller.ts.
 *   ADMIN    everything a MANAGER can do, plus managing user accounts.
 *
 * Everything else in the app is open to any signed-in user.
 */
export enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  // -------- Profile fields --------
  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true, unique: true })
  phone?: string;

  /**
   * The groups this user belongs to, as membership rows.
   *
   * A user's groups are deliberately not duplicated onto this table. `group_members` is the
   * single place that records who is in which group, so a user and a group can never disagree
   * about it, and adding or removing a member stays one write instead of two.
   *
   * `UsersService` maps this to the `groupIds: string[]` carried by every user payload. The
   * groups a user *manages* are the `managerId` on those groups, not a field here.
   */
  @OneToMany(() => GroupMember, (membership) => membership.user)
  memberships?: GroupMember[];
}

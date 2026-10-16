// src/auth/role-sets.ts
import { UserRole } from '../users/entities/user.entity';

/**
 * Roles that may manage the site's content: projects, tasks, media, the social links, the
 * bulk-message queue and the dashboards behind them.
 *
 * It exists so the one role difference in the API is written down once. Every controller that
 * guards a content-management route uses `@Roles(...MANAGEMENT_ROLES)`; user accounts are the
 * single exception, guarded by `@Roles(UserRole.ADMIN)` in src/users/users.controller.ts,
 * because a MANAGER may not read, create, edit or delete accounts.
 *
 * Adding a role that should manage content means adding it here — the per-controller decorators
 * then follow automatically.
 */
export const MANAGEMENT_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER];

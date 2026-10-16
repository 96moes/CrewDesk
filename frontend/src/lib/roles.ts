// src/lib/roles.ts
import type { UserRole } from "../api/auth";

/**
 * What each role may do, answered in one place.
 *
 * The UI mirrors the API here, and the two must agree: MANAGEMENT_ROLES in
 * backend/src/auth/role-sets.ts guards every content-management endpoint, while the account
 * endpoints in backend/src/users/users.controller.ts stay ADMIN-only. A page must not offer a
 * link to something the same account would then be refused — see layouts/sectionNav.tsx.
 */

/**
 * May manage site content: projects, tasks, gallery, the message queue and the dashboards
 * behind them. True for MANAGER and ADMIN, false for USER and for a signed-out visitor.
 */
export function canManageContent(role: UserRole | null | undefined): boolean {
    return role === "ADMIN" || role === "MANAGER";
}

/**
 * May manage user accounts — list, create, edit, delete.
 *
 * This is the whole of the difference between a manager and an administrator, and the reason
 * /dashboard/users is guarded by AdminRoute while every other panel page is not.
 */
export function canManageUsers(role: UserRole | null | undefined): boolean {
    return role === "ADMIN";
}

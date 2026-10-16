// src/lib/roleMeta.ts
import type { UserRole } from "../api/auth";

/**
 * What each role is called, in one place, so the users page and the dashboards cannot disagree
 * about the wording.
 *
 * What a role may DO lives next door in src/lib/roles.ts; this file is only how it is named.
 * Adding a role means adding it to both, and to UserRole in src/api/auth.ts.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "مدیر",
  MANAGER: "سرپرست",
  USER: "کاربر",
};

/** The order roles are offered in a picker: the most privileged first. */
export const ROLE_ORDER: UserRole[] = ["ADMIN", "MANAGER", "USER"];

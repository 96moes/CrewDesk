// src/components/RoleBadge.tsx
import type { ReactNode } from "react";
import { FaUserShield, FaUserTie } from "react-icons/fa";
import type { UserRole } from "../api/auth";
import { ROLE_LABELS } from "../lib/roleMeta";

/**
 * A role shown as a badge: its colour and icon here, its wording from lib/roleMeta.ts.
 *
 * Anything that displays a role in passing uses this, so a new role gets its look in one place.
 * Places that need the plain text — a form's <option>, for instance — take ROLE_LABELS directly.
 */
const ROLE_BADGES: Record<UserRole, string> = {
    ADMIN: "bg-primary-100 text-primary-800",
    MANAGER: "bg-warning-50 text-warning-700",
    USER: "bg-success-50 text-success-700",
};

const ROLE_ICONS: Partial<Record<UserRole, ReactNode>> = {
    ADMIN: <FaUserShield size={10} />,
    MANAGER: <FaUserTie size={10} />,
};

export default function RoleBadge({ role }: { role: UserRole }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGES[role]}`}
        >
            {ROLE_ICONS[role]}
            {ROLE_LABELS[role]}
        </span>
    );
}

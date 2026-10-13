// src/pages/admin/AdminLayout.tsx
import {
    FaTachometerAlt,
    FaUsers,
    FaProjectDiagram,
    FaTasks,
    FaEnvelope,
    FaUsersCog,
    FaImages,
} from "react-icons/fa";
import PanelShell, { type PanelNavItem } from "../../components/PanelShell";
import { useAuthStore } from "../../stores/authStore";

/**
 * Panel layout for `/dashboard/*`.
 *
 * The frame itself lives in PanelShell, which the user dashboard renders too, so both areas look
 * identical. This file only decides what the panel contains and who may see it:
 *
 *   - administrators get the full navigation and the "داشبورد مدیریتی" title
 *   - group leaders get the one page they are allowed to use, and a title that does not call
 *     them an administrator
 *
 * The panel is not wrapped in AdminRoute as a whole (see src/App.tsx): group endpoints are open to
 * any signed-in user per backend/src/groups/groups.controller.ts, so AdminRoute is applied per
 * admin-only page instead.
 */

const ADMIN_LINKS: PanelNavItem[] = [
    { to: "/dashboard", label: "نمای کلی", icon: <FaTachometerAlt />, end: true },
    { to: "/dashboard/users", label: "کاربران", icon: <FaUsers /> },
    { to: "/dashboard/projects", label: "پروژه‌ها", icon: <FaProjectDiagram /> },
    { to: "/dashboard/tasks", label: "وظایف", icon: <FaTasks /> },
    { to: "/dashboard/bulk-messages", label: "صف پیام‌ها", icon: <FaEnvelope /> },
    { to: "/dashboard/gallery", label: "گالری", icon: <FaImages /> },
];

/** Reachable by any signed-in user, including group leaders. */
const GROUP_LINKS: PanelNavItem[] = [
    { to: "/dashboard/groups", label: "گروه‌ها", icon: <FaUsersCog /> },
];

export default function AdminLayout() {
    const role = useAuthStore((s) => s.role);
    const isAdmin = role === "ADMIN";

    return (
        <PanelShell
            title={isAdmin ? "داشبورد مدیریتی" : "گروه‌های من"}
            brandTo={isAdmin ? "/dashboard" : "/dashboard/groups"}
            nav={isAdmin ? [...ADMIN_LINKS, ...GROUP_LINKS] : GROUP_LINKS}
        />
    );
}

// src/layouts/sectionNav.tsx
import {
    FaTachometerAlt,
    FaUsers,
    FaProjectDiagram,
    FaTasks,
    FaEnvelope,
    FaUsersCog,
    FaImages,
} from "react-icons/fa";
import type { PanelNavItem } from "../components/PanelShell";
import type { UserRole } from "../api/auth";
import { canManageContent, canManageUsers } from "../lib/roles";

/**
 * Navigation for the two signed-in sections, defined once.
 *
 * It lives here rather than in either layout because both need part of it: the user area shows
 * the management pages to administrators and managers, and the management area shows the group
 * page, which every signed-in user may open.
 */

/** The panel landing page. */
const OVERVIEW: PanelNavItem = {
    to: "/dashboard",
    label: "نمای کلی",
    icon: <FaTachometerAlt />,
    end: true,
};

/**
 * The one page a manager may not open. This entry must stay out of MANAGEMENT_PAGES and stay in
 * step with AdminRoute in src/App.tsx — showing a link to a page the visitor is about to be
 * redirected away from is worse than showing no link at all.
 */
const USERS_PAGE: PanelNavItem = {
    to: "/dashboard/users",
    label: "کاربران",
    icon: <FaUsers />,
};

const PROJECTS: PanelNavItem = {
    to: "/dashboard/projects",
    label: "پروژه‌ها",
    icon: <FaProjectDiagram />,
};

const TASKS: PanelNavItem = {
    to: "/dashboard/tasks",
    label: "وظایف",
    icon: <FaTasks />,
};

const BULK_MESSAGES: PanelNavItem = {
    to: "/dashboard/bulk-messages",
    label: "صف پیام‌ها",
    icon: <FaEnvelope />,
};

const GALLERY: PanelNavItem = {
    to: "/dashboard/gallery",
    label: "گالری",
    icon: <FaImages />,
};

/**
 * The pages administrators and managers both work in, in the order the panel shows them. This
 * list must mirror the routes wrapped in ManagementRoute in src/App.tsx.
 */
const MANAGEMENT_PAGES: PanelNavItem[] = [
    OVERVIEW,
    PROJECTS,
    TASKS,
    BULK_MESSAGES,
    GALLERY,
];

/** The signed-in user's own dashboard — the landing page after login. */
const MY_DASHBOARD: PanelNavItem = {
    to: "/dashboard/user",
    label: "داشبورد من",
    icon: <FaTachometerAlt />,
    end: true,
};

/**
 * Groups. Not management-only: the backend grants the group endpoints to whichever signed-in
 * user leads a group (see backend/src/groups/groups.controller.ts).
 */
const GROUPS: PanelNavItem = {
    to: "/dashboard/groups",
    label: "گروه‌ها",
    icon: <FaUsersCog />,
};

/** Everything any signed-in account may open, in the order the user area shows it. */
const MY_PAGES: PanelNavItem[] = [MY_DASHBOARD, GROUPS];

/**
 * The management pages for a role: the same list for both, except that only an administrator is
 * offered the user page.
 */
function managementPages(role: UserRole | null): PanelNavItem[] {
    return canManageUsers(role)
        ? [OVERVIEW, USERS_PAGE, PROJECTS, TASKS, BULK_MESSAGES, GALLERY]
        : MANAGEMENT_PAGES;
}

/**
 * Navigation for the user area: the visitor's own pages, plus the management pages when they
 * hold a management role. That is nearly the whole of the role difference in the UI —
 * administrators and managers see the same links bar the user page, and nobody else sees any.
 */
export function userSectionNav(role: UserRole | null): PanelNavItem[] {
    return canManageContent(role) ? [...MY_PAGES, ...managementPages(role)] : MY_PAGES;
}

/** Navigation for the management area. */
export function adminSectionNav(role: UserRole | null): PanelNavItem[] {
    return [...managementPages(role), GROUPS];
}

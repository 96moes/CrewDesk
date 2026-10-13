// src/pages/admin/AdminLayout.tsx
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import {
    FaTachometerAlt,
    FaUsers,
    FaProjectDiagram,
    FaTasks,
    FaEnvelope,
    FaUsersCog,
    FaSignOutAlt,
    FaExternalLinkAlt,
} from "react-icons/fa";
import { useAuthStore } from "../../stores/authStore";

/**
 * Shell for the panel area.
 *
 * This route is rendered OUTSIDE MainLayout (see src/App.tsx), so the public header and footer
 * are absent. That is deliberate: they are site navigation, and inside the panel they compete
 * with the panel nav, squeeze the tables into a max-width column, and push visitors back out to
 * the public pages. AdminLayout supplies the whole frame instead:
 *
 *   - a compact top bar: brand, title, "view site", logout
 *   - the panel navigation, horizontally scrollable at the top on small screens and a sticky
 *     sidebar beside the content from lg upward
 *   - a full-width content column, because these screens are table-heavy
 *
 * The panel is shared by two audiences, so the navigation is filtered by role: administrators
 * see everything, while group leaders see only the group page they are allowed to use. The top
 * bar title follows the same split rather than calling a group leader an administrator.
 */

const ADMIN_LINKS = [
    { to: "/dashboard", label: "نمای کلی", icon: <FaTachometerAlt />, end: true },
    { to: "/dashboard/users", label: "کاربران", icon: <FaUsers />, end: false },
    { to: "/dashboard/projects", label: "پروژه‌ها", icon: <FaProjectDiagram />, end: false },
    { to: "/dashboard/tasks", label: "وظایف", icon: <FaTasks />, end: false },
    { to: "/dashboard/bulk-messages", label: "صف پیام‌ها", icon: <FaEnvelope />, end: false },
];

/** Reachable by any signed-in user, including group leaders. */
const GROUP_LINKS = [
    { to: "/dashboard/groups", label: "گروه‌ها", icon: <FaUsersCog />, end: false },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const role = useAuthStore((s) => s.role);
    const logout = useAuthStore((s) => s.logout);

    const isAdmin = role === "ADMIN";
    const links = isAdmin ? [...ADMIN_LINKS, ...GROUP_LINKS] : GROUP_LINKS;

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    const tabClass = ({ isActive }: { isActive: boolean }) =>
        `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive
                ? "bg-primary-700 text-white"
                : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
        }`;

    return (
        <div className="flex min-h-screen w-full flex-col bg-gray-50">
            {/* Top bar */}
            <header className="sticky top-0 z-40 border-b border-primary-100 bg-white/90 backdrop-blur">
                <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            to={isAdmin ? "/dashboard" : "/dashboard/groups"}
                            className="flex shrink-0 items-center gap-2"
                            aria-label={isAdmin ? "داشبورد مدیریتی" : "گروه‌های من"}
                        >
                            <span
                                aria-hidden="true"
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700 text-sm font-bold text-white"
                            >
                                ق‌س
                            </span>
                        </Link>
                        <div className="min-w-0 leading-tight">
                            <p className="truncate text-sm font-bold text-primary-800">
                                {isAdmin ? "داشبورد مدیریتی" : "گروه‌های من"}
                            </p>
                            <p className="truncate text-[11px] text-gray-500">
                                {user?.username ? `خوش آمدید، ${user.username}` : "قوم سلمان"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="flex items-center gap-2 rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                            title="مشاهده سایت"
                        >
                            <FaExternalLinkAlt size={13} />
                            <span className="hidden sm:inline">مشاهده سایت</span>
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-lg bg-primary-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800"
                        >
                            <FaSignOutAlt size={14} />
                            <span className="hidden sm:inline">خروج</span>
                        </button>
                    </div>
                </div>

                {/*
                  Panel navigation. On small screens it sits directly under the top bar as a
                  horizontally scrollable strip; from lg it moves into the sidebar below.
                */}
                <nav
                    aria-label="بخش‌های مدیریت"
                    className="flex gap-1 overflow-x-auto border-t border-primary-50 px-2 py-2 lg:hidden"
                >
                    {links.map((l) => (
                        <NavLink key={l.to} to={l.to} end={l.end} className={tabClass}>
                            <span aria-hidden="true">{l.icon}</span>
                            <span>{l.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </header>

            {/* Body: sidebar + content, side by side from lg upward */}
            <div className="flex w-full flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:gap-6 lg:py-6">
                <aside className="hidden lg:block lg:w-60 lg:shrink-0">
                    <nav
                        aria-label="بخش‌های مدیریت"
                        className="sticky top-24 flex flex-col gap-1 rounded-xl border border-primary-100 bg-white p-2"
                    >
                        {links.map((l) => (
                            <NavLink key={l.to} to={l.to} end={l.end} className={tabClass}>
                                <span aria-hidden="true">{l.icon}</span>
                                <span>{l.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                <main className="min-w-0 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

// src/components/PanelShell.tsx
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { FaExternalLinkAlt, FaSignOutAlt } from "react-icons/fa";
import { useAuthStore } from "../stores/authStore";

/**
 * The one frame used by every signed-in area: the admin panel and the user dashboard.
 *
 * Both render this shell, so the top bar, the navigation (a horizontally scrollable strip at the
 * top on small screens, a sticky sidebar beside the content from lg upward), the dark-on-light
 * palette and the full-width content column are identical everywhere. Only the navigation items
 * and the panel title differ, and those are passed in.
 *
 * The shell is rendered OUTSIDE MainLayout (see src/App.tsx), so the public header and footer are
 * absent. That is deliberate: they are site navigation, and inside a signed-in area they compete
 * with the panel navigation, squeeze the tables into a max-width column, and push users back out
 * to the public pages. The top bar therefore carries its own "view site" link and logout.
 */

export interface PanelNavItem {
    to: string;
    label: string;
    icon: ReactNode;
    /** Exact match, for an index route like /dashboard. */
    end?: boolean;
}

interface Props {
    /** Panel name shown in the top bar, e.g. "داشبورد مدیریتی". */
    title: string;
    nav: PanelNavItem[];
    /** Where the brand mark links to. Defaults to "/". */
    brandTo?: string;
    children?: ReactNode;
}

export default function PanelShell({ title, nav, brandTo = "/", children }: Props) {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    const itemClass = ({ isActive }: { isActive: boolean }) =>
        [
            "group relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5",
            "text-sm font-medium transition-all duration-200",
            isActive
                ? "bg-gradient-to-l from-primary-600 to-primary-700 text-white shadow-[var(--shadow-card)]"
                : "text-gray-600 hover:bg-primary-50 hover:text-primary-800",
        ].join(" ");

    return (
        <div className="flex min-h-screen w-full flex-col bg-transparent">
            <header className="sticky top-0 z-40 border-b border-primary-100/80 bg-white/75 backdrop-blur-lg">
                <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            to={brandTo}
                            className="group flex shrink-0 items-center gap-2.5"
                            aria-label={title}
                        >
                            <span
                                aria-hidden="true"
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform duration-200 group-hover:scale-105"
                            >
                                ق‌س
                            </span>
                        </Link>
                        <div className="min-w-0 leading-tight">
                            <p className="truncate text-sm font-bold text-primary-900">{title}</p>
                            <p className="truncate text-[11px] text-gray-500">
                                {user?.username ? `خوش آمدید، ${user.username}` : "قوم سلمان"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-800"
                            title="مشاهده سایت"
                        >
                            <FaExternalLinkAlt size={13} />
                            <span className="hidden sm:inline">مشاهده سایت</span>
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 px-3 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all duration-200 hover:from-primary-700 hover:to-primary-800 hover:shadow-[var(--shadow-raised)]"
                        >
                            <FaSignOutAlt size={14} />
                            <span className="hidden sm:inline">خروج</span>
                        </button>
                    </div>
                </div>

                <nav
                    aria-label={title}
                    className="flex gap-1.5 overflow-x-auto border-t border-primary-50 px-3 py-2 lg:hidden"
                >
                    {nav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={itemClass}
                        >
                            <span aria-hidden="true">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </header>

            <div className="flex w-full flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:gap-6 lg:py-6">
                <aside className="hidden lg:block lg:w-60 lg:shrink-0">
                    <nav
                        aria-label={title}
                        className="sticky top-24 flex flex-col gap-1.5 rounded-2xl border border-primary-100/80 bg-white/80 p-2.5 shadow-[var(--shadow-card)] backdrop-blur"
                    >
                        {nav.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={itemClass}
                            >
                                <span aria-hidden="true">{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                <main className="min-w-0 flex-1">{children ?? <Outlet />}</main>
            </div>
        </div>
    );
}

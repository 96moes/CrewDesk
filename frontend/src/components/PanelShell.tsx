// src/components/PanelShell.tsx
import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { FaExternalLinkAlt, FaSignOutAlt } from "react-icons/fa";
import { HiMenu, HiX } from "react-icons/hi";
import { useAuthStore } from "../stores/authStore";

/**
 * The one frame used by every signed-in area: the management panel and the user dashboard.
 *
 * The bar is the public site's bar, down to the styles (components/Header.tsx): sticky and
 * blurred, the brand mark and the panel name on one side, the section's links as underlined
 * labels in the middle, the account actions on the other, and below `lg` the same hamburger menu
 * the public header opens. A signed-in area should feel like the same site, and navigation along
 * the top leaves the full width to the tables underneath — the reason the shell no longer spends a
 * column on a sidebar.
 *
 * The shell is rendered OUTSIDE MainLayout (see src/App.tsx), so there is no public header or
 * footer around it: they are site navigation, and inside a signed-in area they would compete with
 * these links and offer a way out of the panel at every scroll position. The bar therefore carries
 * its own "view site" link and logout, again in the public header's styles.
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
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    /**
     * An underline under the label marks the current page — the public header's treatment, kept
     * identical here so the two bars cannot drift apart. With seven links a filled pill per item
     * would turn the bar into a row of buttons and bury the panel name.
     */
    const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
        [
            "relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors duration-200",
            "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full",
            "after:transition-transform after:duration-200 after:origin-center",
            isActive
                ? "text-primary-800 after:scale-x-100 after:bg-primary-600"
                : "text-gray-600 after:scale-x-0 after:bg-primary-400 hover:text-primary-700 hover:after:scale-x-100",
        ].join(" ");

    /** The public header's expanded-menu item, icons included. */
    const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
        [
            "flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
            isActive
                ? "bg-primary-100 text-primary-800"
                : "text-gray-700 hover:bg-primary-50 hover:text-primary-700",
        ].join(" ");

    return (
        <div className="flex min-h-screen w-full flex-col bg-transparent">
            <header className="sticky top-0 z-40 border-b border-primary-100/80 bg-white/75 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
                <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    {/* Brand mark and the panel name, in place of the public site's name. */}
                    <Link
                        to={brandTo}
                        className="group flex min-w-0 shrink items-center gap-2.5"
                        aria-label={title}
                    >
                        <span
                            aria-hidden="true"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform duration-200 group-hover:scale-105"
                        >
                            ق‌س
                        </span>
                        <span className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate text-base font-bold tracking-tight text-primary-900 sm:text-lg">
                                {title}
                            </span>
                            <span className="truncate text-[10px] font-medium text-primary-600">
                                {user?.username
                                    ? `خوش آمدید، ${user.username}`
                                    : "قوم سلمان"}
                            </span>
                        </span>
                    </Link>

                    {/* Desktop navigation */}
                    <nav className="hidden items-center gap-0.5 lg:flex" aria-label={title}>
                        {nav.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={desktopLinkClass}
                            >
                                <span aria-hidden="true">{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Account actions, in the public header's two weights: the site link is the
                        quiet pill, logout the plain button beside it. */}
                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm font-medium text-primary-800 ring-1 ring-primary-100 transition-all duration-200 hover:bg-primary-100 hover:ring-primary-200"
                            title="مشاهده سایت"
                        >
                            <FaExternalLinkAlt size={13} />
                            <span className="hidden sm:inline">مشاهده سایت</span>
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
                            title="خروج"
                        >
                            <FaSignOutAlt size={14} />
                            <span className="hidden sm:inline">خروج</span>
                        </button>

                        {/* Mobile toggle. It covers everything below lg, the width at which the
                            inline links appear, so the navigation is never out of reach. */}
                        <button
                            type="button"
                            onClick={() => setOpen((value) => !value)}
                            className="rounded-xl p-2 text-primary-700 transition-colors hover:bg-primary-50 lg:hidden"
                            aria-label={open ? "بستن منو" : "باز کردن منو"}
                            aria-expanded={open}
                        >
                            {open ? <HiX size={22} /> : <HiMenu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile navigation */}
                {open && (
                    <nav
                        className="animate-rise border-t border-primary-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:hidden"
                        aria-label={title}
                    >
                        <div className="flex flex-col gap-1">
                            {nav.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={mobileLinkClass}
                                    onClick={() => setOpen(false)}
                                >
                                    <span aria-hidden="true">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </nav>
                )}
            </header>

            <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:py-6">
                {children ?? <Outlet />}
            </main>
        </div>
    );
}

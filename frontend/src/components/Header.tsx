// src/components/Header.tsx
import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router";
import { HiMenu, HiX } from "react-icons/hi";
import { FaUserCircle, FaUserShield, FaUserTie } from "react-icons/fa";
import { useAuthStore } from "../stores/authStore";
import { canManageContent, canManageUsers } from "../lib/roles";

interface NavItem {
    to: string;
    label: string;
}

const NAV_ITEMS: NavItem[] = [
    { to: "/", label: "خانه" },
    { to: "/about", label: "معرفی درباره ما" },
    { to: "/gallery", label: "ویدیو و عکس" },
    { to: "/education", label: "آموزش‌ها" },
    { to: "/cooperation", label: "فرصت‌های همکاری" },
    { to: "/donations", label: "کمک‌های مردمی" },
    { to: "/events", label: "رویدادهای برگزار شده" },
];

export default function Header() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);
    const role = useAuthStore((s) => s.role);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();
        setOpen(false);
        navigate("/");
    };

    /**
     * Desktop links are an underline rather than a filled pill: with seven items a pill per
     * link turns the bar into a row of buttons and buries the brand. The active marker is a
     * short bar under the label, which reads as "you are here" without adding weight.
     */
    const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
        [
            "relative px-3 py-2 text-sm font-medium transition-colors duration-200",
            "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full",
            "after:transition-transform after:duration-200 after:origin-center",
            isActive
                ? "text-primary-800 after:scale-x-100 after:bg-primary-600"
                : "text-gray-600 after:scale-x-0 after:bg-primary-400 hover:text-primary-700 hover:after:scale-x-100",
        ].join(" ");

    const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
        [
            "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
            isActive
                ? "bg-primary-100 text-primary-800"
                : "text-gray-700 hover:bg-primary-50 hover:text-primary-700",
        ].join(" ");

    /**
     * The single panel link: administrators and managers open the management panel, everyone
     * else (group managers) the group page. The icon and title name the role so the link is not
     * the only clue about which panel is behind it.
     */
    const isAdmin = canManageUsers(role);
    const isManagement = canManageContent(role);
    const dashboardTo = isManagement ? "/dashboard" : "/dashboard/user";
    const dashboardTitle = isAdmin
        ? "داشبورد مدیریتی"
        : isManagement
          ? "داشبورد مدیریت"
          : "گروه‌های من";
    const dashboardIcon = isAdmin ? (
        <FaUserShield size={16} />
    ) : isManagement ? (
        <FaUserTie size={16} />
    ) : (
        <FaUserCircle size={16} />
    );
    const dashboardLabel = user?.username ?? "داشبورد من";

    return (
        <header className="sticky top-0 z-40 border-b border-primary-100/80 bg-white/75 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
                {/* Brand */}
                <NavLink to="/" className="group flex shrink-0 items-center gap-2.5">
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform duration-200 group-hover:scale-105">
                        ق‌س
                    </span>
                    <span className="flex flex-col leading-tight">
                        <span className="text-lg font-bold tracking-tight text-primary-900">
                            قوم سلمان
                        </span>
                        <span className="text-[10px] font-medium text-primary-600">
                            در مسیر امام زمان (عج)
                        </span>
                    </span>
                </NavLink>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-0.5 lg:flex">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={desktopLinkClass}
                            end={item.to === "/"}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Auth area */}
                <div className="hidden items-center gap-2 md:flex">
                    {token ? (
                        <>
                            <Link
                                to={dashboardTo}
                                className="flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm font-medium text-primary-800 ring-1 ring-primary-100 transition-all duration-200 hover:bg-primary-100 hover:ring-primary-200"
                                title={dashboardTitle}
                            >
                                {dashboardIcon}
                                <span className="max-w-28 truncate">{dashboardLabel}</span>
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
                            >
                                خروج
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-all duration-200 hover:from-primary-700 hover:to-primary-800 hover:shadow-[var(--shadow-raised)]"
                        >
                            ورود / ثبت‌نام
                        </Link>
                    )}
                </div>

                {/* Mobile toggle */}
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="rounded-xl p-2 text-primary-700 transition-colors hover:bg-primary-50 md:hidden"
                    aria-label={open ? "بستن منو" : "باز کردن منو"}
                    aria-expanded={open}
                >
                    {open ? <HiX size={22} /> : <HiMenu size={22} />}
                </button>
            </div>

            {/* Mobile nav */}
            {open && (
                <nav className="animate-rise border-t border-primary-100 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
                    <div className="flex flex-col gap-1">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={mobileLinkClass}
                                end={item.to === "/"}
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </NavLink>
                        ))}

                        <div className="mt-2 border-t border-gray-100 pt-3">
                            {token ? (
                                <div className="flex flex-col gap-1">
                                    <Link
                                        to={dashboardTo}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800"
                                    >
                                        {dashboardIcon}
                                        {dashboardLabel}
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="rounded-xl px-4 py-3 text-right text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                                    >
                                        خروج
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setOpen(false)}
                                    className="block rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 px-4 py-3 text-center text-sm font-semibold text-white"
                                >
                                    ورود / ثبت‌نام
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>
            )}
        </header>
    );
}

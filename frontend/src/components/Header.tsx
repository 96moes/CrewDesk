// src/components/Header.tsx
import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router";
import { HiMenu, HiX } from "react-icons/hi";
import { FaUserCircle, FaUserShield } from "react-icons/fa";
import { useAuthStore } from "../stores/authStore";

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
    const role = useAuthStore((s) => s.role);   // 👈 ADDED
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();
        setOpen(false);
        navigate("/");
    };

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
            ? "bg-primary-100 text-primary-800"
            : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
        }`;

    // Where to send the logged-in user
    const dashboardTo = role === "ADMIN" ? "/dashboard" : "/dashboard/user";
    const dashboardLabel = user?.username ?? "داشبورد من";

    return (
        <header className="sticky top-0 z-40 border-b border-primary-100 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                {/* Logo */}
                <NavLink to="/" className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-white font-bold">
                        ق‌س
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-lg font-bold text-primary-800">قوم سلمان</span>
                        <span className="text-[10px] text-primary-700">
                            در مسیر امام زمان (عج)
                        </span>
                    </div>
                </NavLink>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={linkClass}
                            end={item.to === "/"}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Auth area */}
                <div className="hidden md:flex items-center gap-3">
                    {token ? (
                        <>
                            {/* Single dashboard link — goes to admin if ADMIN, else user */}
                            <Link
                                to={dashboardTo}
                                className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-800 hover:bg-primary-100"
                                title={role === "ADMIN" ? "داشبورد مدیریتی" : "داشبورد من"}
                            >
                                {role === "ADMIN" ? (
                                    <FaUserShield size={18} />
                                ) : (
                                    <FaUserCircle size={18} />
                                )}
                                {dashboardLabel}
                            </Link>
                            <Link
                                to="/groups"
                                className="rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                            >
                                گروه‌های من
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                            >
                                خروج
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800"
                        >
                            ورود / ثبت‌نام
                        </Link>
                    )}
                </div>

                {/* Mobile toggle */}
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="md:hidden rounded-lg p-2 text-primary-700 hover:bg-primary-50"
                    aria-label="منو"
                >
                    {open ? <HiX size={22} /> : <HiMenu size={22} />}
                </button>
            </div>

            {/* Mobile nav */}
            {open && (
                <nav className="md:hidden border-t border-primary-100 bg-white px-4 py-3">
                    <div className="flex flex-col gap-1">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={linkClass}
                                end={item.to === "/"}
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </NavLink>
                        ))}

                        {token ? (
                            <>
                                <Link
                                    to={dashboardTo}
                                    onClick={() => setOpen(false)}
                                    className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-800"
                                >
                                    {role === "ADMIN" ? (
                                        <FaUserShield size={18} />
                                    ) : (
                                        <FaUserCircle size={18} />
                                    )}
                                    {dashboardLabel}
                                </Link>
                                <Link
                                    to="/groups"
                                    onClick={() => setOpen(false)}
                                    className="mt-2 rounded-lg border border-primary-200 px-4 py-2 text-center text-sm font-medium text-primary-700"
                                >
                                    گروه‌های من
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700"
                                >
                                    خروج
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                onClick={() => setOpen(false)}
                                className="mt-2 rounded-lg bg-primary-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-800"
                            >
                                ورود / ثبت‌نام
                            </Link>
                        )}
                    </div>
                </nav>
            )}
        </header>
    );
}
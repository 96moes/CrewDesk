// src/pages/admin/AdminLayout.tsx
import { NavLink, Outlet } from "react-router";
import {
    FaTachometerAlt,
    FaUsers,
    FaProjectDiagram,
    FaTasks,
    FaEnvelope,
} from "react-icons/fa";

const LINKS = [
    { to: "/dashboard", label: "نمای کلی", icon: <FaTachometerAlt />, end: true },
    { to: "/dashboard/users", label: "کاربران", icon: <FaUsers />, end: false },
    { to: "/dashboard/projects", label: "پروژه‌ها", icon: <FaProjectDiagram />, end: false },
    { to: "/dashboard/tasks", label: "وظایف", icon: <FaTasks />, end: false },
    { to: "/dashboard/bulk-messages", label: "صف پیام‌ها", icon: <FaEnvelope />, end: false },
];

export default function AdminLayout() {
    const cls = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
            ? "bg-primary-700 text-white"
            : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
        }`;

    return (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            {/* Sidebar */}
            <aside className="h-fit rounded-xl border border-primary-100 bg-white p-3 lg:sticky lg:top-24">
                <p className="mb-2 px-2 text-xs font-medium text-gray-500">
                    داشبورد مدیریتی
                </p>
                <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                    {LINKS.map((l) => (
                        <NavLink key={l.to} to={l.to} end={l.end} className={cls}>
                            <span className="text-base">{l.icon}</span>
                            <span>{l.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Content */}
            <section className="min-w-0">
                <Outlet />
            </section>
        </div>
    );
}
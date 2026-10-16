// src/components/Header.tsx
import { Link, useNavigate } from "react-router";
import { FaUserCircle, FaUserShield, FaUserTie } from "react-icons/fa";
import TopBar from "./TopBar";
import { useAuthStore } from "../stores/authStore";
import { canManageContent, canManageUsers } from "../lib/roles";
import { PUBLIC_NAV } from "../layouts/publicNav";

/**
 * The public site's top bar.
 *
 * The bar itself — brand, links, menu, skip link — is components/TopBar.tsx; what belongs here is
 * only what the public site adds to it: the pages it links to (layouts/publicNav.ts, shared with the
 * footer's quick links) and the account area on the right, which is a login link for a visitor and
 * a way into the panel for everyone else.
 */
export default function Header() {
    const navigate = useNavigate();

    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);
    const role = useAuthStore((s) => s.role);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    /**
     * The single panel link: administrators and managers open the management panel, everyone else
     * (group managers) the group page. The icon and title name the role, so the link is not the only
     * clue about which panel is behind it.
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

    const accountActions = token ? (
        <>
            <Link
                to={dashboardTo}
                className="flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm font-medium text-primary-800 ring-1 ring-primary-100 transition-all duration-200 hover:bg-primary-100 hover:ring-primary-200"
                title={dashboardTitle}
            >
                {dashboardIcon}
                <span className="max-w-28 truncate">
                    {user?.username ?? "داشبورد من"}
                </span>
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
    );

    return (
        <TopBar
            title="قوم سلمان"
            subtitle="در مسیر امام زمان (عج)"
            brandTo="/"
            links={PUBLIC_NAV}
            actions={accountActions}
            menuActions={accountActions}
            label="منوی اصلی"
            align="page"
        />
    );
}

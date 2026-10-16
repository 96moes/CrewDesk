// src/components/PanelShell.tsx
import type { ReactNode } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { FaExternalLinkAlt, FaSignOutAlt } from "react-icons/fa";
import TopBar, { type TopBarLink } from "./TopBar";
import Container from "./Container";
import { useAuthStore } from "../stores/authStore";

/**
 * The one frame used by every signed-in area: the management panel and the user dashboard.
 *
 * The bar is the public site's bar — same chrome, same links, same menu, same skip link — from
 * components/TopBar.tsx; what this shell adds is the panel's own identity (its name, where its brand
 * leads, its navigation) and the account actions that replace the public ones. The content runs the
 * full width, because the tables here are the reason the shell exists.
 *
 * The shell is rendered OUTSIDE MainLayout (see src/App.tsx), so there is no public header or footer
 * around it: they are site navigation, and inside a signed-in area they would compete with these
 * links and offer a way out of the panel at every scroll position. The bar therefore carries its own
 * "view site" link and logout, in the public header's two weights.
 */

export interface PanelNavItem extends TopBarLink {
    icon: ReactNode;
}

interface Props {
    /** Panel name shown in the top bar, e.g. "داشبورد مدیریتی". */
    title: string;
    nav: PanelNavItem[];
    /** Where the brand mark links to. Defaults to "/". */
    brandTo?: string;
    children?: ReactNode;
}

export default function PanelShell({
    title,
    nav,
    brandTo = "/",
    children,
}: Props) {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    /** The public header's two weights: the site link is the quiet pill, logout the plain button. */
    const accountActions = (
        <>
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
        </>
    );

    return (
        <div className="flex min-h-screen w-full flex-col bg-transparent">
            <TopBar
                title={title}
                subtitle={
                    user?.username ? `خوش آمدید، ${user.username}` : "قوم سلمان"
                }
                brandTo={brandTo}
                links={nav}
                actions={accountActions}
                menuActions={accountActions}
                label={title}
                align="screen"
            />

            <main
                id="main"
                tabIndex={-1}
                className="min-w-0 flex-1 py-5 outline-none lg:py-6"
            >
                <Container align="screen">{children ?? <Outlet />}</Container>
            </main>
        </div>
    );
}

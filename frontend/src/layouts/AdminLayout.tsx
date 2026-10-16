// src/layouts/AdminLayout.tsx
import PanelShell from "../components/PanelShell";
import { useAuthStore } from "../stores/authStore";
import { adminSectionNav, userSectionNav } from "./sectionNav";
import { canManageContent } from "../lib/roles";

/**
 * Layout for the management panel: /dashboard and its child pages.
 *
 * The frame comes from PanelShell, which UserLayout renders too, so both signed-in areas look
 * identical; only the navigation differs. See src/App.tsx for the three sections.
 *
 * The panel is not wrapped in a guard as a whole — ManagementRoute and AdminRoute are applied per
 * page inside it. This layout therefore also renders briefly for a signed-in user without a
 * management role, while the guard redirects them to /dashboard/groups. The role check below
 * exists so that moment never shows management links: it falls back to the user navigation
 * instead.
 */
export default function AdminLayout() {
    const role = useAuthStore((s) => s.role);
    const isManagement = canManageContent(role);

    if (!isManagement) {
        return (
            <PanelShell
                title="گروه‌های من"
                brandTo="/dashboard/groups"
                nav={userSectionNav(role)}
            />
        );
    }

    return (
        <PanelShell
            title="داشبورد مدیریتی"
            brandTo="/dashboard"
            nav={adminSectionNav(role)}
        />
    );
}

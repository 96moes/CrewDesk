// src/layouts/UserLayout.tsx
import PanelShell from "../components/PanelShell";
import { useAuthStore } from "../stores/authStore";
import { userSectionNav } from "./sectionNav";

/**
 * Layout for the signed-in user area — the pages every account holder may open,
 * whatever their role:
 *
 *   /dashboard/user     the generic user dashboard
 *   /dashboard/groups   the groups they lead
 *
 * The app has three sections and each one has a single layout: the public pages use MainLayout, this
 * area uses UserLayout, and the management pages use AdminLayout. All three signed-in routes sit
 * outside MainLayout on purpose — the public header and footer are site navigation, and inside a
 * signed-in area they compete with the panel navigation and wrap the tables in a max-width column.
 *
 * The frame itself comes from components/PanelShell.tsx, which AdminLayout renders too: the same
 * top bar (components/TopBar.tsx) as the public site, with this section's links. The role check
 * decides one thing only: administrators and managers also get the management pages in the
 * navigation, which is how they reach them without a second entry point. Nobody else ever sees those
 * links.
 */
export default function UserLayout() {
    const role = useAuthStore((s) => s.role);

    return (
        <PanelShell
            title="داشبورد من"
            brandTo="/dashboard/user"
            nav={userSectionNav(role)}
        />
    );
}

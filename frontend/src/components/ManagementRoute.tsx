// src/components/ManagementRoute.tsx
import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../stores/authStore";
import { canManageContent } from "../lib/roles";

/**
 * Restricts everything it wraps to the accounts that run the site content: administrators and
 * managers.
 *
 * It is applied per page inside the panel rather than once around it, because the panel also
 * hosts the group page, which any signed-in user may open. A visitor without a management role is
 * sent to /dashboard/groups — the page they can act on — rather than to the panel overview, which
 * would only redirect them again. The one page it does not cover is /dashboard/users, which
 * AdminRoute guards for administrators alone.
 */
export default function ManagementRoute() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.role);

    if (!token) return <Navigate to="/login" replace />;
    if (!canManageContent(role)) return <Navigate to="/dashboard/groups" replace />;
    return <Outlet />;
}

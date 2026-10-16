// src/components/AdminRoute.tsx
import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../stores/authStore";
import { canManageContent, canManageUsers } from "../lib/roles";

/**
 * Restricts everything it wraps to administrators.
 *
 * It guards one page: /dashboard/users. User accounts are the whole of the difference between an
 * administrator and a manager — every other panel page accepts both roles, which is what
 * ManagementRoute (components/ManagementRoute.tsx) is for.
 *
 * A manager who lands here is sent to /dashboard, the panel they do work in, rather than to the
 * group page: they have somewhere better to be. An ordinary user, who has no panel of their own,
 * still goes to /dashboard/groups, the page they can act on. See the sections in src/App.tsx.
 */
export default function AdminRoute() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.role);

    if (!token) return <Navigate to="/login" replace />;
    if (!canManageUsers(role)) {
        return (
            <Navigate
                to={canManageContent(role) ? "/dashboard" : "/dashboard/groups"}
                replace
            />
        );
    }
    return <Outlet />;
}

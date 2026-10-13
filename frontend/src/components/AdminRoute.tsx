// src/components/AdminRoute.tsx
import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../stores/authStore";

/**
 * Restricts everything it wraps to administrators.
 *
 * Used per page inside the panel rather than once around it, because the panel also hosts
 * group management, which any signed-in group leader may use. A non-admin who somehow reaches
 * an admin-only page is sent to the group page, which is the one panel page they can use —
 * redirecting them to /dashboard/user instead would bounce them out of the panel entirely.
 */
export default function AdminRoute() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.role);

    if (!token) return <Navigate to="/login" replace />;
    if (role !== "ADMIN") return <Navigate to="/dashboard/groups" replace />;
    return <Outlet />;
}

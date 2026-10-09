// src/components/AdminRoute.tsx
import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../stores/authStore";

export default function AdminRoute() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.role);

    if (!token) return <Navigate to="/login" replace />;
    if (role !== "ADMIN") return <Navigate to="/dashboard/user" replace />;
    return <Outlet />;
}
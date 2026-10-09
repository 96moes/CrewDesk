// src/pages/Login.tsx
import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../stores/authStore";

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const loading = useAuthStore((s) => s.loading);
    const error = useAuthStore((s) => s.error);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const onSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        try {
            await login(username.trim(), password);
            navigate("/dashboard/user");
        } catch {
            /* error shown from store */
        }
    };

    return (
        <div className="mx-auto max-w-md py-10">
            <div className="rounded-2xl border border-primary-100 bg-white p-8 shadow-sm">
                <h1 className="mb-2 text-2xl font-bold text-primary-800">ورود به حساب</h1>
                <p className="mb-6 text-sm text-gray-500">
                    برای مشاهده داشبورد شخصی خود وارد شوید.
                </p>

                {error && (
                    <div className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            نام کاربری
                        </label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            رمز عبور
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-primary-700 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
                    >
                        {loading ? "در حال ورود..." : "ورود"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    حساب کاربری ندارید؟{" "}
                    <Link to="/register" className="font-medium text-primary-700 hover:underline">
                        ثبت‌نام کنید
                    </Link>
                </p>
            </div>
        </div>
    );
}
// src/pages/UserDashboard.tsx
import { useEffect, useState, type ReactNode } from "react";
import PageHeader from "../components/PageHeader";
import {
    FaUserTie,
    FaProjectDiagram,
    FaTasks,
    FaCheckCircle,
    FaClock,
    FaHourglassHalf,
    FaPhone,
} from "react-icons/fa";
import { useAuthStore } from "../stores/authStore";
import { getMyProfile, type ProfileResponse } from "../api/users";
import { getMyProjects, type Project } from "../api/projects";
import { getMyTasks, type Task, type TaskStatus } from "../api/tasks";

const ROLE_LABELS: Record<string, string> = {
    REGISTRAR: "ثبت‌کننده",
    REPORT_VIEWER: "بیننده گزارش",
    ADMIN: "مدیر",
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    todo: "در انتظار",
    in_progress: "در حال انجام",
    done: "انجام شده",
};

const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
    todo: "bg-primary-100 text-primary-800",
    in_progress: "bg-warning-50 text-warning-700",
    done: "bg-success-50 text-success-700",
};

const TASK_STATUS_ICONS: Record<TaskStatus, ReactNode> = {
    todo: <FaHourglassHalf size={12} />,
    in_progress: <FaClock size={12} />,
    done: <FaCheckCircle size={12} />,
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
    active: "فعال",
    paused: "متوقف",
    done: "پایان‌یافته",
};

export default function UserDashboard() {
    const user = useAuthStore((s) => s.user);
    const fetchMe = useAuthStore((s) => s.fetchMe);

    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMe().catch(() => { });
    }, [fetchMe]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([getMyProfile(), getMyProjects(), getMyTasks()])
            .then(([p, pr, t]) => {
                if (cancelled) return;
                setProfile(p);
                setProjects(pr);
                setTasks(t);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.response?.data?.message ?? "خطا در بارگذاری اطلاعات");
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading && !profile) {
        return (
            <div className="py-10 text-center text-gray-500">
                در حال بارگذاری اطلاعات...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl bg-error-50 p-6 text-sm text-error-700">
                {error}
            </div>
        );
    }

    const doneCount = tasks.filter((t) => t.status === "done").length;
    const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

    return (
        <div>
            <PageHeader
                title={`داشبورد ${profile?.username ?? user?.username ?? ""}`}
                subtitle="اطلاعات حساب، مسئول مستقیم و پروژه‌های در دست اجرا"
            />

            {/* Top cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Profile */}
                <div className="rounded-xl border border-primary-100 bg-white p-6">
                    <div className="mb-3 flex items-center gap-2 text-primary-700">
                        <FaUserTie />
                        <h2 className="font-semibold">اطلاعات حساب</h2>
                    </div>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">نام کاربری</dt>
                            <dd className="font-medium text-gray-800">{profile?.username}</dd>
                        </div>
                        {profile?.fullName && (
                            <div className="flex justify-between">
                                <dt className="text-gray-500">نام کامل</dt>
                                <dd className="font-medium text-gray-800">{profile.fullName}</dd>
                            </div>
                        )}
                        {profile?.phone && (
                            <div className="flex justify-between">
                                <dt className="flex items-center gap-1 text-gray-500">
                                    <FaPhone size={11} /> تلفن
                                </dt>
                                <dd className="font-mono text-xs text-gray-700" dir="ltr">
                                    {profile.phone}
                                </dd>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <dt className="text-gray-500">نقش</dt>
                            <dd className="font-medium text-gray-800">
                                {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Manager */}
                <div className="rounded-xl border border-primary-100 bg-white p-6">
                    <div className="mb-3 flex items-center gap-2 text-primary-700">
                        <FaProjectDiagram />
                        <h2 className="font-semibold">مسئول مستقیم</h2>
                    </div>
                    {profile?.manager ? (
                        <>
                            <p className="text-lg font-bold text-gray-800">
                                {profile.manager.username}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                برای هماهنگی با مسئول خود از طریق تلگرام اقدام کنید.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">
                            مسئولی برای شما تعیین نشده است.
                        </p>
                    )}
                </div>

                {/* Progress */}
                <div className="rounded-xl border border-primary-100 bg-white p-6">
                    <div className="mb-3 flex items-center gap-2 text-primary-700">
                        <FaTasks />
                        <h2 className="font-semibold">پیشرفت وظایف</h2>
                    </div>
                    <p className="text-3xl font-bold text-primary-700">{progress}%</p>
                    <div className="mt-2 h-2 w-full rounded-full bg-primary-100">
                        <div
                            className="h-2 rounded-full bg-primary-600 transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        {doneCount} از {tasks.length} وظیفه به پایان رسیده
                    </p>
                </div>
            </div>

            {/* Projects */}
            <div className="mt-8 rounded-xl border border-primary-100 bg-white">
                <div className="border-b border-primary-50 p-5">
                    <h2 className="font-semibold text-primary-800">پروژه‌های من</h2>
                    <p className="mt-1 text-xs text-gray-500">
                        پروژه‌هایی که در آن‌ها نقش دارید
                    </p>
                </div>
                {projects.length === 0 ? (
                    <p className="p-6 text-center text-sm text-gray-500">
                        در حال حاضر در هیچ پروژه‌ای عضو نیستید.
                    </p>
                ) : (
                    <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((p) => (
                            <div
                                key={p.id}
                                className="rounded-lg border border-primary-100 bg-primary-50/40 p-4"
                            >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-semibold text-primary-800">
                                        {p.title}
                                    </h3>
                                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-primary-700">
                                        {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                                    </span>
                                </div>
                                <p className="line-clamp-2 text-xs leading-6 text-gray-600">
                                    {p.description || "—"}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tasks table */}
            <div className="mt-8 rounded-xl border border-primary-100 bg-white">
                <div className="border-b border-primary-50 p-5">
                    <h2 className="font-semibold text-primary-800">وظایف من</h2>
                    <p className="mt-1 text-xs text-gray-500">
                        فهرست وظایفی که به شما محول شده است
                    </p>
                </div>

                {tasks.length === 0 ? (
                    <p className="p-6 text-center text-sm text-gray-500">
                        وظیفه‌ای برای شما ثبت نشده است.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-right text-sm">
                            <thead className="bg-primary-50 text-xs text-primary-800">
                                <tr>
                                    <th className="p-3 font-medium">وظیفه</th>
                                    <th className="p-3 font-medium">پروژه</th>
                                    <th className="p-3 font-medium">وضعیت</th>
                                    <th className="p-3 font-medium">مهلت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary-50">
                                {tasks.map((t) => (
                                    <tr key={t.id} className="hover:bg-primary-50/40">
                                        <td className="p-3 text-gray-800">{t.title}</td>
                                        <td className="p-3 text-gray-600">
                                            {t.project?.title ?? "—"}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${TASK_STATUS_STYLES[t.status]}`}
                                            >
                                                {TASK_STATUS_ICONS[t.status]}
                                                {TASK_STATUS_LABELS[t.status]}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs text-gray-500">
                                            {t.deadline
                                                ? new Date(t.deadline).toLocaleDateString("fa-IR")
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Admin notice */}
            {profile?.role === "ADMIN" && (
                <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-5 text-sm text-primary-800">
                    شما با نقش <b>مدیر</b> وارد شده‌اید. برای مدیریت کاربران، پروژه‌ها و
                    وظایف می‌توانید به{" "}
                    <a href="/dashboard" className="font-medium underline">
                        داشبورد مدیریتی
                    </a>{" "}
                    مراجعه کنید.
                </div>
            )}
        </div>
    );
}
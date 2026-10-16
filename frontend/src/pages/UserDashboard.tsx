// src/pages/UserDashboard.tsx
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
    FaUserTie,
    FaTasks,
    FaCheckCircle,
    FaClock,
    FaHourglassHalf,
    FaPhone,
    FaUsersCog,
} from "react-icons/fa";
import { useAuthStore } from "../stores/authStore";
import { canManageContent, canManageUsers } from "../lib/roles";
import { ROLE_LABELS } from "../lib/roleMeta";
import { getMyProfile, type ProfileResponse } from "../api/users";
import { getMyProjects, type Project } from "../api/projects";
import { getMyTasks, type Task, type TaskStatus } from "../api/tasks";
import { getMyGroups, type ManagedGroup } from "../api/groups";

/**
 * The generic signed-in dashboard, and the default landing page after login.
 *
 * This page renders its content only. The frame, the navigation and the role-aware links come
 * from layouts/UserLayout.tsx, which wraps this route — so the layout decides what a visitor
 * may navigate to, and this file never has to know their role for that purpose.
 */

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
    const [groups, setGroups] = useState<ManagedGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMe().catch(() => { });
    }, [fetchMe]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getMyProfile(),
            getMyProjects(),
            getMyTasks(),
            // The group list only supplies names for the ids the profile already carries, so a
            // failure here must not take the rest of the dashboard down with it.
            getMyGroups().catch(() => [] as ManagedGroup[]),
        ])
            .then(([p, pr, t, g]) => {
                if (cancelled) return;
                setProfile(p);
                setProjects(pr);
                setTasks(t);
                setGroups(g);
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

    // The groups this user relates to: what /groups/my returned, or — if that call failed —
    // the bare ids the profile carries, so the card still shows something true.
    const groupEntries =
        groups.length > 0
            ? groups.map((group) => ({
                id: group.id,
                name: group.name as string | null,
                isManager: group.managerId === profile?.id,
            }))
            : (profile?.groupIds ?? []).map((id) => ({
                id,
                name: null as string | null,
                isManager: false,
            }));

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-primary-800">
                    داشبورد {profile?.username ?? user?.username ?? ""}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    اطلاعات حساب، گروه‌هایی که در آن‌ها عضو هستید و پروژه‌های در دست اجرا
                </p>
            </div>

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
                                {profile ? ROLE_LABELS[profile.role] : "—"}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* The user's groups. /groups/my returns the groups they manage as well as the
                    ones they belong to; profile.groupIds covers the case where that call failed
                    but the ids are still known. */}
                <div className="rounded-xl border border-primary-100 bg-white p-6">
                    <div className="mb-3 flex items-center gap-2 text-primary-700">
                        <FaUsersCog />
                        <h2 className="font-semibold">گروه‌های من</h2>
                    </div>
                    {groupEntries.length > 0 ? (
                        <ul className="space-y-2">
                            {groupEntries.map((entry) => (
                                <li
                                    key={entry.id}
                                    className="rounded-lg bg-primary-50/70 px-3 py-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-gray-800">
                                            {entry.name ?? "گروه"}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${entry.isManager
                                                    ? "bg-primary-100 text-primary-800"
                                                    : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {entry.isManager ? "مدیر گروه" : "عضو"}
                                        </span>
                                    </div>
                                    <p
                                        className="mt-0.5 font-mono text-[11px] text-gray-500"
                                        dir="ltr"
                                    >
                                        {entry.id}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">
                            هنوز عضو هیچ گروهی نیستید.
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

            {/* Management notice — administrators and managers both run the panel, so the
                wording only differs in what each of them may manage there. */}
            {canManageContent(profile?.role) && (
                <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-5 text-sm text-primary-800">
                    شما با نقش <b>{profile && ROLE_LABELS[profile.role]}</b> وارد شده‌اید. برای
                    مدیریت{" "}
                    {canManageUsers(profile?.role)
                        ? "کاربران، پروژه‌ها و وظایف"
                        : "پروژه‌ها، وظایف و گالری"}{" "}
                    می‌توانید به{" "}
                    <Link to="/dashboard" className="font-medium underline">
                        داشبورد مدیریتی
                    </Link>{" "}
                    مراجعه کنید.
                </div>
            )}
        </>
    );
}
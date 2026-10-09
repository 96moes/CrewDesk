// src/pages/admin/ProjectsManage.tsx
import { useEffect, useState, type SyntheticEvent } from "react";
import { useProjectsStore } from "../../stores/projectsStore";
import type { Project } from "../../api/projects";
import { useUsersAdminStore } from "../../stores/usersAdminStore";
import Modal from "../../components/Modal";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const STATUS_LABELS: Record<Project["status"], string> = {
    active: "فعال",
    paused: "متوقف",
    done: "پایان‌یافته",
};

const STATUS_BADGES: Record<Project["status"], string> = {
    active: "bg-success-50 text-success-700",
    paused: "bg-warning-50 text-warning-700",
    done: "bg-primary-100 text-primary-800",
};

interface FormState {
    title: string;
    description: string;
    managerId: string;
    status: Project["status"];
}

const EMPTY: FormState = {
    title: "",
    description: "",
    managerId: "",
    status: "active",
};

export default function ProjectsManage() {
    const projects = useProjectsStore((s) => s.projects);
    const loading = useProjectsStore((s) => s.loading);
    const loaded = useProjectsStore((s) => s.loaded);
    const error = useProjectsStore((s) => s.error);
    const fetchProjects = useProjectsStore((s) => s.fetch);
    const add = useProjectsStore((s) => s.add);
    const edit = useProjectsStore((s) => s.edit);
    const remove = useProjectsStore((s) => s.remove);

    const users = useUsersAdminStore((s) => s.users);
    const fetchUsers = useUsersAdminStore((s) => s.fetch);

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Project | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

    // ---------- Initial load ----------
    useEffect(() => {
        if (!loaded) fetchProjects();
    }, [loaded, fetchProjects]);

    useEffect(() => {
        if (users.length === 0) fetchUsers();
    }, [users.length, fetchUsers]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY);
        setFormError(null);
        setOpen(true);
    };

    const openEdit = (p: Project) => {
        setEditing(p);
        setForm({
            title: p.title,
            description: p.description ?? "",
            managerId: p.managerId ?? "",
            status: p.status,
        });
        setFormError(null);
        setOpen(true);
    };

    const submit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setBusy(true);
        setFormError(null);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description,
                status: form.status,
                managerId: form.managerId || undefined,
            };

            if (editing) {
                await edit(editing.id, payload);
            } else {
                await add(payload);
            }
            setOpen(false);
        } catch (err: any) {
            setFormError(
                err?.response?.data?.message ?? "خطا در ذخیره‌سازی پروژه",
            );
        } finally {
            setBusy(false);
        }
    };

    const doDelete = async () => {
        if (!confirmDelete) return;
        setBusy(true);
        try {
            await remove(confirmDelete.id);
            setConfirmDelete(null);
        } catch (err: any) {
            alert(err?.response?.data?.message ?? "خطا در حذف پروژه");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary-800">
                        مدیریت پروژه‌ها
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        ایجاد و مدیریت پروژه‌های سازمان
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
                >
                    <FaPlus /> پروژه جدید
                </button>
            </div>

            {/* Global error */}
            {error && (
                <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">
                    {error}
                </div>
            )}

            {/* List */}
            {loading && projects.length === 0 ? (
                <div className="rounded-xl border border-primary-100 bg-white p-8 text-center text-gray-500">
                    در حال بارگذاری…
                </div>
            ) : projects.length === 0 ? (
                <div className="rounded-xl border border-primary-100 bg-white p-8 text-center text-gray-500">
                    پروژه‌ای ثبت نشده است.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((p) => (
                        <div
                            key={p.id}
                            className="flex flex-col rounded-xl border border-primary-100 bg-white p-5"
                        >
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <h3 className="text-base font-semibold text-primary-800">
                                    {p.title}
                                </h3>
                                <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[p.status]}`}
                                >
                                    {STATUS_LABELS[p.status]}
                                </span>
                            </div>
                            <p className="flex-1 text-sm leading-6 text-gray-600 line-clamp-3">
                                {p.description || "—"}
                            </p>
                            <p className="mt-3 text-xs text-gray-500">
                                مدیر:{" "}
                                <span className="font-medium text-gray-700">
                                    {p.manager?.username ?? "نامشخص"}
                                </span>
                            </p>
                            <div className="mt-4 flex justify-end gap-1 border-t border-primary-50 pt-3">
                                <button
                                    onClick={() => openEdit(p)}
                                    className="rounded-lg p-2 text-primary-700 hover:bg-primary-50"
                                    title="ویرایش"
                                >
                                    <FaEdit size={14} />
                                </button>
                                <button
                                    onClick={() => setConfirmDelete(p)}
                                    className="rounded-lg p-2 text-error-600 hover:bg-error-50"
                                    title="حذف"
                                >
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / edit modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? "ویرایش پروژه" : "پروژه جدید"}
            >
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            عنوان پروژه
                        </label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            توضیحات
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm({ ...form, description: e.target.value })
                            }
                            rows={3}
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            مدیر پروژه
                        </label>
                        <select
                            value={form.managerId}
                            onChange={(e) =>
                                setForm({ ...form, managerId: e.target.value })
                            }
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500"
                        >
                            <option value="">— انتخاب کنید —</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            وضعیت
                        </label>
                        <select
                            value={form.status}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    status: e.target.value as Project["status"],
                                })
                            }
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500"
                        >
                            <option value="active">فعال</option>
                            <option value="paused">متوقف</option>
                            <option value="done">پایان‌یافته</option>
                        </select>
                    </div>

                    {formError && (
                        <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                            {formError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
                        >
                            {busy ? "در حال ذخیره…" : "ذخیره"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete confirm */}
            <Modal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="حذف پروژه"
            >
                <p className="mb-4 text-sm text-gray-700">
                    آیا از حذف پروژه «<b>{confirmDelete?.title}</b>» مطمئن هستید؟
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={doDelete}
                        disabled={busy}
                        className="rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-60"
                    >
                        {busy ? "در حال حذف…" : "حذف"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
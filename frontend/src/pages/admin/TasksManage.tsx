// src/pages/admin/TasksManage.tsx
import { useEffect, useState, type SyntheticEvent } from "react";
import { useTasksStore } from "../../stores/tasksStore";
import type { Task, TaskStatus } from "../../api/tasks";
import { useProjectsStore } from "../../stores/projectsStore";
import { useUserDirectoryStore } from "../../stores/userDirectoryStore";
import Modal from "../../components/Modal";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const STATUS_LABELS: Record<TaskStatus, string> = {
    todo: "در انتظار",
    in_progress: "در حال انجام",
    done: "انجام شده",
};

const STATUS_BADGES: Record<TaskStatus, string> = {
    todo: "bg-primary-100 text-primary-800",
    in_progress: "bg-warning-50 text-warning-700",
    done: "bg-success-50 text-success-700",
};

interface FormState {
    title: string;
    projectId: string;
    assigneeId: string;
    status: TaskStatus;
    deadline: string; // yyyy-mm-dd
}

const EMPTY: FormState = {
    title: "",
    projectId: "",
    assigneeId: "",
    status: "todo",
    deadline: "",
};

function toDateInput(iso?: string | null) {
    if (!iso) return "";
    return iso.slice(0, 10);
}

export default function TasksManage() {
    const tasks = useTasksStore((s) => s.tasks);
    const tasksLoading = useTasksStore((s) => s.loading);
    const tasksLoaded = useTasksStore((s) => s.loaded);
    const tasksError = useTasksStore((s) => s.error);
    const fetchTasks = useTasksStore((s) => s.fetch);
    const add = useTasksStore((s) => s.add);
    const edit = useTasksStore((s) => s.edit);
    const remove = useTasksStore((s) => s.remove);

    const projects = useProjectsStore((s) => s.projects);
    const projectsLoaded = useProjectsStore((s) => s.loaded);
    const fetchProjects = useProjectsStore((s) => s.fetch);

    // The assignee picker: id and username only, which is what every management role may read.
    const directory = useUserDirectoryStore((s) => s.entries);
    const directoryLoaded = useUserDirectoryStore((s) => s.loaded);
    const fetchDirectory = useUserDirectoryStore((s) => s.fetch);

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Task | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

    // ---------- Initial load ----------
    useEffect(() => {
        if (!tasksLoaded) fetchTasks();
    }, [tasksLoaded, fetchTasks]);

    useEffect(() => {
        if (!projectsLoaded) fetchProjects();
    }, [projectsLoaded, fetchProjects]);

    useEffect(() => {
        if (!directoryLoaded) fetchDirectory();
    }, [directoryLoaded, fetchDirectory]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY);
        setFormError(null);
        setOpen(true);
    };

    const openEdit = (t: Task) => {
        setEditing(t);
        setForm({
            title: t.title,
            projectId: t.projectId ?? "",
            assigneeId: t.assigneeId ?? "",
            status: t.status,
            deadline: toDateInput(t.deadline),
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
                projectId: form.projectId || undefined,
                assigneeId: form.assigneeId || undefined,
                status: form.status,
                deadline: form.deadline
                    ? new Date(form.deadline).toISOString()
                    : undefined,
            };

            if (editing) {
                await edit(editing.id, payload);
            } else {
                await add(payload);
            }
            setOpen(false);
        } catch (err: any) {
            setFormError(
                err?.response?.data?.message ?? "خطا در ذخیره‌سازی وظیفه",
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
            alert(err?.response?.data?.message ?? "خطا در حذف وظیفه");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary-800">مدیریت وظایف</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        تخصیص وظایف به کاربران در قالب پروژه‌ها
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
                >
                    <FaPlus /> وظیفه جدید
                </button>
            </div>

            {/* Global error */}
            {tasksError && (
                <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">
                    {tasksError}
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-primary-100 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-right text-sm">
                        <thead className="bg-primary-50 text-xs text-primary-800">
                            <tr>
                                <th className="p-3 font-medium">وظیفه</th>
                                <th className="p-3 font-medium">پروژه</th>
                                <th className="p-3 font-medium">مسئول</th>
                                <th className="p-3 font-medium">وضعیت</th>
                                <th className="p-3 font-medium">مهلت</th>
                                <th className="p-3 font-medium">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-50">
                            {tasksLoading && tasks.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="p-6 text-center text-gray-500"
                                    >
                                        در حال بارگذاری…
                                    </td>
                                </tr>
                            )}

                            {!tasksLoading && tasks.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="p-6 text-center text-gray-500"
                                    >
                                        وظیفه‌ای ثبت نشده است.
                                    </td>
                                </tr>
                            )}

                            {tasks.map((t) => (
                                <tr key={t.id} className="hover:bg-primary-50/40">
                                    <td className="p-3 font-medium text-gray-800">
                                        {t.title}
                                    </td>
                                    <td className="p-3 text-gray-600">
                                        {t.project?.title ?? "—"}
                                    </td>
                                    <td className="p-3 text-gray-600">
                                        {t.assignee?.username ?? "—"}
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGES[t.status]}`}
                                        >
                                            {STATUS_LABELS[t.status]}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs text-gray-500">
                                        {t.deadline
                                            ? new Date(t.deadline).toLocaleDateString("fa-IR")
                                            : "—"}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEdit(t)}
                                                className="rounded-lg p-2 text-primary-700 hover:bg-primary-50"
                                                title="ویرایش"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(t)}
                                                className="rounded-lg p-2 text-error-600 hover:bg-error-50"
                                                title="حذف"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / edit modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? "ویرایش وظیفه" : "وظیفه جدید"}
            >
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            عنوان وظیفه
                        </label>
                        <input
                            value={form.title}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            }
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            پروژه
                        </label>
                        <select
                            value={form.projectId}
                            onChange={(e) =>
                                setForm({ ...form, projectId: e.target.value })
                            }
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500"
                        >
                            <option value="">— انتخاب کنید —</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            مسئول
                        </label>
                        <select
                            value={form.assigneeId}
                            onChange={(e) =>
                                setForm({ ...form, assigneeId: e.target.value })
                            }
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500"
                        >
                            <option value="">— انتخاب کنید —</option>
                            {directory.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                وضعیت
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        status: e.target.value as TaskStatus,
                                    })
                                }
                                className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500"
                            >
                                <option value="todo">در انتظار</option>
                                <option value="in_progress">در حال انجام</option>
                                <option value="done">انجام شده</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                مهلت
                            </label>
                            <input
                                type="date"
                                value={form.deadline}
                                onChange={(e) =>
                                    setForm({ ...form, deadline: e.target.value })
                                }
                                className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500"
                            />
                        </div>
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
                title="حذف وظیفه"
            >
                <p className="mb-4 text-sm text-gray-700">
                    آیا از حذف وظیفه «<b>{confirmDelete?.title}</b>» مطمئن هستید؟
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
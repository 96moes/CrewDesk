// src/pages/admin/UsersManage.tsx
import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import { useUsersAdminStore } from "../../stores/usersAdminStore";
import Modal from "../../components/Modal";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaUserShield,
    FaUserTie,
} from "react-icons/fa";
import type { AdminUser, UserRole } from "../../api/users";

/**
 * User accounts — the one panel page a manager may not open (components/AdminRoute.tsx).
 *
 * Adding a role here means adding it to UserRole in src/api/auth.ts and to MANAGEMENT_ROLES in
 * backend/src/auth/role-sets.ts if it should manage site content.
 */
const ROLE_LABELS: Record<UserRole, string> = {
    ADMIN: "مدیر",
    MANAGER: "سرپرست",
    USER: "کاربر",
};

const ROLE_BADGES: Record<UserRole, string> = {
    ADMIN: "bg-primary-100 text-primary-800",
    MANAGER: "bg-warning-50 text-warning-700",
    USER: "bg-success-50 text-success-700",
};

const ROLE_ICONS: Partial<Record<UserRole, ReactNode>> = {
    ADMIN: <FaUserShield size={10} />,
    MANAGER: <FaUserTie size={10} />,
};

interface FormState {
    username: string;
    password: string;
    role: UserRole;
}

const EMPTY: FormState = { username: "", password: "", role: "USER" };

export default function UsersManage() {
    const { users, loading, error, fetch, add, edit, remove } =
        useUsersAdminStore();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminUser | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

    useEffect(() => { fetch(); }, [fetch]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY);
        setFormError(null);
        setOpen(true);
    };

    const openEdit = (u: AdminUser) => {
        setEditing(u);
        setForm({ username: u.username, password: "", role: u.role });
        setFormError(null);
        setOpen(true);
    };

    const submit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setBusy(true);
        setFormError(null);
        try {
            if (editing) {
                const payload: any = {
                    username: form.username,
                    role: form.role,
                };
                if (form.password.trim()) payload.password = form.password;
                await edit(editing.id, payload);
            } else {
                await add({
                    username: form.username.trim(),
                    password: form.password,
                    role: form.role,
                });
            }
            setOpen(false);
        } catch (err: any) {
            setFormError(
                err?.response?.data?.message ?? "خطا در ذخیره‌سازی کاربر",
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
            alert(err?.response?.data?.message ?? "خطا در حذف کاربر");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary-800">مدیریت کاربران</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        افزودن، ویرایش و حذف کاربران سیستم
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
                >
                    <FaPlus /> کاربر جدید
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-primary-100 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-right text-sm">
                        <thead className="bg-primary-50 text-xs text-primary-800">
                            <tr>
                                <th className="p-3 font-medium">نام کاربری</th>
                                <th className="p-3 font-medium">نقش</th>
                                <th className="p-3 font-medium">گروه‌ها</th>
                                <th className="p-3 font-medium">شناسه</th>
                                <th className="p-3 font-medium">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-50">
                            {loading && users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-500">
                                        در حال بارگذاری…
                                    </td>
                                </tr>
                            )}
                            {!loading && users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-500">
                                        کاربری یافت نشد.
                                    </td>
                                </tr>
                            )}
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-primary-50/40">
                                    <td className="p-3 font-medium text-gray-800">{u.username}</td>
                                    <td className="p-3">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGES[u.role]}`}
                                        >
                                            {ROLE_ICONS[u.role]}
                                            {ROLE_LABELS[u.role]}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {/* Ids of the groups this user is in. Membership lives in
                                            group_members, so this is read-only here. */}
                                        {u.groupIds.length === 0 ? (
                                            <span className="text-xs text-gray-400">—</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {u.groupIds.map((groupId) => (
                                                    <span
                                                        key={groupId}
                                                        title={groupId}
                                                        dir="ltr"
                                                        className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[11px] text-primary-800"
                                                    >
                                                        {groupId.slice(0, 8)}…
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3 font-mono text-xs text-gray-500">
                                        {u.id.slice(0, 8)}…
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEdit(u)}
                                                className="rounded-lg p-2 text-primary-700 hover:bg-primary-50"
                                                title="ویرایش"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(u)}
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
                title={editing ? "ویرایش کاربر" : "کاربر جدید"}
            >
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            نام کاربری
                        </label>
                        <input
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                            required
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            رمز عبور{" "}
                            {editing && (
                                <span className="text-xs text-gray-400">
                                    (خالی بگذارید تا تغییر نکند)
                                </span>
                            )}
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                            required={!editing}
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            نقش
                        </label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500"
                        >
                            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
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
                title="حذف کاربر"
            >
                <p className="mb-4 text-sm text-gray-700">
                    آیا از حذف کاربر «<b>{confirmDelete?.username}</b>» مطمئن هستید؟ این
                    عملیات قابل بازگشت نیست.
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
// src/pages/admin/UsersManage.tsx
import { useEffect, useState } from "react";
import { useUsersAdminStore } from "../../stores/usersAdminStore";
import Modal from "../../components/Modal";
import RoleBadge from "../../components/RoleBadge";
import UserFormModal from "./UserFormModal";
import { apiErrorMessage } from "../../lib/apiError";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import type { AdminUser } from "../../api/users";

/**
 * User accounts — the one panel page a manager may not open (components/AdminRoute.tsx).
 *
 * The page keeps two jobs: the table, and which account is open for editing or deletion. The
 * dialog itself is pages/admin/UserFormModal.tsx, which owns the form and the save; role wording
 * comes from lib/roleMeta.ts and the badge from components/RoleBadge.tsx.
 */

/**
 * What the form dialog is open on: `undefined` is closed, `null` creates an account, an account
 * edits it. A closed dialog and "create a new one" are different states, so they stay different.
 */
type FormTarget = AdminUser | null | undefined;

/** A phone number is registered by one account, so it is shown in its own column. */
function PhoneCell({ phone }: { phone?: string | null }) {
    if (!phone?.trim()) return <span className="text-xs text-gray-400">—</span>;
    return (
        <span dir="ltr" className="font-mono text-xs text-gray-700">
            {phone}
        </span>
    );
}

export default function UsersManage() {
    const users = useUsersAdminStore((s) => s.users);
    const loading = useUsersAdminStore((s) => s.loading);
    const loaded = useUsersAdminStore((s) => s.loaded);
    const error = useUsersAdminStore((s) => s.error);
    const fetch = useUsersAdminStore((s) => s.fetch);
    const remove = useUsersAdminStore((s) => s.remove);

    const [formTarget, setFormTarget] = useState<FormTarget>(undefined);
    const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        if (!loaded) fetch();
    }, [loaded, fetch]);

    const closeDelete = () => {
        setConfirmDelete(null);
        setDeleteError(null);
    };

    const doDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await remove(confirmDelete.id);
            setConfirmDelete(null);
        } catch (err) {
            // Shown inside the dialog rather than in an alert: the account is still here, and the
            // reason belongs next to the button that failed.
            setDeleteError(apiErrorMessage(err, "خطا در حذف کاربر"));
        } finally {
            setDeleting(false);
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
                    onClick={() => setFormTarget(null)}
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
                    <table className="w-full min-w-[720px] text-right text-sm">
                        <thead className="bg-primary-50 text-xs text-primary-800">
                            <tr>
                                <th className="p-3 font-medium">نام کاربری</th>
                                <th className="p-3 font-medium">نام و نام خانوادگی</th>
                                <th className="p-3 font-medium">تلفن</th>
                                <th className="p-3 font-medium">نقش</th>
                                <th className="p-3 font-medium">گروه‌ها</th>
                                <th className="p-3 font-medium">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-50">
                            {loading && users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-gray-500">
                                        در حال بارگذاری…
                                    </td>
                                </tr>
                            )}
                            {!loading && users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-gray-500">
                                        کاربری یافت نشد.
                                    </td>
                                </tr>
                            )}
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-primary-50/40">
                                    <td className="p-3 font-medium text-gray-800">
                                        {u.username}
                                    </td>
                                    <td className="p-3 text-gray-700">
                                        {u.fullName?.trim() || (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <PhoneCell phone={u.phone} />
                                    </td>
                                    <td className="p-3">
                                        <RoleBadge role={u.role} />
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
                                    <td className="p-3">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setFormTarget(u)}
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

            {/* Create / edit. The key remounts the form when another account is opened, so its
                fields always start from the account on screen. */}
            <UserFormModal
                key={formTarget === undefined ? "closed" : (formTarget?.id ?? "new")}
                open={formTarget !== undefined}
                user={formTarget ?? null}
                onClose={() => setFormTarget(undefined)}
            />

            {/* Delete confirm */}
            <Modal
                open={!!confirmDelete}
                onClose={closeDelete}
                title="حذف کاربر"
            >
                <p className="mb-4 text-sm text-gray-700">
                    آیا از حذف کاربر «
                    <b>{confirmDelete?.fullName?.trim() || confirmDelete?.username}</b>» مطمئن
                    هستید؟ این عملیات قابل بازگشت نیست.
                </p>

                {deleteError && (
                    <div className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                        {deleteError}
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={closeDelete}
                        className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={doDelete}
                        disabled={deleting}
                        className="rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-60"
                    >
                        {deleting ? "در حال حذف…" : "حذف"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

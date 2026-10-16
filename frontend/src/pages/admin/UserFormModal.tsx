// src/pages/admin/UserFormModal.tsx
import { useState, type SyntheticEvent } from "react";
import Modal from "../../components/Modal";
import { useUsersAdminStore } from "../../stores/usersAdminStore";
import { apiErrorMessage } from "../../lib/apiError";
import { ROLE_LABELS, ROLE_ORDER } from "../../lib/roleMeta";
import type { AdminUser, UserRole } from "../../api/users";

/**
 * The create/edit dialog for one account.
 *
 * It owns the form — the values, the busy flag and the error the API returns — so the page behind
 * it only decides which account is open. The page mounts it with a key, so opening a different
 * account gives a fresh form without an effect copying props into state.
 *
 * Name and phone number are part of an account rather than extras: the phone is how the account is
 * found when it is added to a group, and how a group message reaches it. Both are therefore
 * required when creating one. While editing, clearing either sends null rather than an empty
 * string — null clears the column, and it is also what keeps the unique phone index happy, since
 * two empty strings would collide.
 */

interface Props {
    open: boolean;
    /** The account being edited; null creates a new one. */
    user: AdminUser | null;
    onClose: () => void;
}

interface FormState {
    username: string;
    fullName: string;
    phone: string;
    password: string;
    role: UserRole;
}

function initialForm(user: AdminUser | null): FormState {
    return {
        username: user?.username ?? "",
        fullName: user?.fullName ?? "",
        phone: user?.phone ?? "",
        password: "",
        role: user?.role ?? "USER",
    };
}

const FIELD_CLASS =
    "w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

const LABEL_CLASS = "mb-1 block text-sm font-medium text-gray-700";

export default function UserFormModal({ open, user, onClose }: Props) {
    const add = useUsersAdminStore((s) => s.add);
    const edit = useUsersAdminStore((s) => s.edit);

    const [form, setForm] = useState<FormState>(() => initialForm(user));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((current) => ({ ...current, [key]: value }));

    const submit = async (event: SyntheticEvent) => {
        event.preventDefault();
        setBusy(true);
        setError(null);

        const fullName = form.fullName.trim();
        const phone = form.phone.trim();

        try {
            if (user) {
                await edit(user.id, {
                    username: form.username.trim(),
                    fullName: fullName === "" ? null : fullName,
                    phone: phone === "" ? null : phone,
                    role: form.role,
                    // An empty box means "leave the password alone", so it is left out of the
                    // request instead of being sent as an empty string.
                    ...(form.password.trim() ? { password: form.password } : {}),
                });
            } else {
                await add({
                    username: form.username.trim(),
                    fullName,
                    phone,
                    password: form.password,
                    role: form.role,
                });
            }
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, "خطا در ذخیره‌سازی کاربر"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={user ? "ویرایش کاربر" : "کاربر جدید"}
        >
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className={LABEL_CLASS} htmlFor="user-username">
                        نام کاربری
                    </label>
                    <input
                        id="user-username"
                        value={form.username}
                        onChange={(e) => update("username", e.target.value)}
                        className={FIELD_CLASS}
                        required
                        dir="ltr"
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS} htmlFor="user-full-name">
                        نام و نام خانوادگی{" "}
                        {user && (
                            <span className="text-xs text-gray-400">
                                (خالی بگذارید تا حذف شود)
                            </span>
                        )}
                    </label>
                    <input
                        id="user-full-name"
                        value={form.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                        className={FIELD_CLASS}
                        required={!user}
                        maxLength={100}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS} htmlFor="user-phone">
                        شماره تلفن{" "}
                        {user && (
                            <span className="text-xs text-gray-400">
                                (خالی بگذارید تا حذف شود)
                            </span>
                        )}
                    </label>
                    <input
                        id="user-phone"
                        type="tel"
                        inputMode="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className={`${FIELD_CLASS} font-mono`}
                        required={!user}
                        maxLength={20}
                        dir="ltr"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        برای افزودن این کاربر به گروه‌ها و ارسال پیام گروهی لازم است.
                    </p>
                </div>

                <div>
                    <label className={LABEL_CLASS} htmlFor="user-password">
                        رمز عبور{" "}
                        {user && (
                            <span className="text-xs text-gray-400">
                                (خالی بگذارید تا تغییر نکند)
                            </span>
                        )}
                    </label>
                    <input
                        id="user-password"
                        type="password"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        className={FIELD_CLASS}
                        required={!user}
                        minLength={6}
                        dir="ltr"
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS} htmlFor="user-role">
                        نقش
                    </label>
                    <select
                        id="user-role"
                        value={form.role}
                        onChange={(e) => update("role", e.target.value as UserRole)}
                        className={FIELD_CLASS}
                    >
                        {ROLE_ORDER.map((role) => (
                            <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
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
    );
}

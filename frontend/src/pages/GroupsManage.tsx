// src/pages/GroupsManage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { useGroupsStore } from "../stores/groupsStore";
import GroupCard from "./groups/GroupCard";
import { apiErrorMessage } from "../lib/apiError";

/**
 * The groups the signed-in user is part of — the page every account may open, whatever their role
 * (groups belong to whoever runs them, not to the management roles: see layouts/sectionNav.tsx).
 *
 * The page owns three things: loading the list, creating a group, and the one notice line that
 * says what just happened. Everything a single group can do lives in pages/groups/, and the list
 * itself lives in stores/groupsStore.ts, so a change made in one card is reflected in the store
 * rather than patched into local state here.
 *
 * Which group is the caller's to manage comes from the API (`group.isManager`), not from comparing
 * ids against a user object the auth store may not have loaded yet — the difference between a card
 * full of controls and a read-only one must not depend on that.
 *
 * The list is not re-fetched on every visit: the store remembers that it has loaded, and every
 * mutation answers with the updated group.
 */
export default function GroupsManage() {
    const groups = useGroupsStore((s) => s.groups);
    const loading = useGroupsStore((s) => s.loading);
    const loaded = useGroupsStore((s) => s.loaded);
    const error = useGroupsStore((s) => s.error);
    const fetch = useGroupsStore((s) => s.fetch);
    const add = useGroupsStore((s) => s.add);

    const [name, setName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        if (!loaded) fetch();
    }, [loaded, fetch]);

    const handleCreate = async (event: FormEvent) => {
        event.preventDefault();
        setCreating(true);
        setCreateError(null);
        setNotice(null);
        try {
            await add(name.trim());
            setName("");
            setNotice("گروه ساخته شد.");
        } catch (err) {
            setCreateError(apiErrorMessage(err, "خطا در ایجاد گروه"));
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-primary-800">گروه‌های من</h1>
                <p className="mt-1 text-sm text-gray-500">
                    گروه بسازید، اعضا را با شماره تلفن یا نام اضافه کنید و برای همه یک
                    پیام ثبت کنید. نام گروه را می‌توانید تغییر دهید یا گروه را حذف
                    کنید.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700"
                >
                    {error}
                </div>
            )}
            {notice && (
                <div
                    role="status"
                    className="mb-4 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700"
                >
                    {notice}
                </div>
            )}

            <form
                onSubmit={handleCreate}
                className="mb-6 rounded-xl border border-primary-100 bg-white p-5"
            >
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={100}
                        required
                        placeholder="نام گروه"
                        aria-label="نام گروه جدید"
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={creating}
                        className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
                    >
                        {creating ? "در حال ایجاد…" : "ایجاد گروه"}
                    </button>
                </div>
                {createError && (
                    <div className="mt-3 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                        {createError}
                    </div>
                )}
            </form>

            {loading && !loaded ? (
                <p className="py-8 text-center text-sm text-gray-500">
                    در حال بارگذاری گروه‌ها…
                </p>
            ) : groups.length === 0 ? (
                <div className="rounded-xl border border-primary-100 bg-white p-8 text-center text-sm text-gray-500">
                    هنوز در گروهی عضو نیستید. با ایجاد اولین گروه، مدیر آن خواهید بود.
                </div>
            ) : (
                <div className="space-y-5">
                    {groups.map((group) => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            isManager={group.isManager}
                            onNotice={setNotice}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

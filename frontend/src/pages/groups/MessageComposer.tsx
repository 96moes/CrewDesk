// src/pages/groups/MessageComposer.tsx
import { useState, type FormEvent } from "react";
import { useGroupsStore } from "../../stores/groupsStore";
import { apiErrorMessage } from "../../lib/apiError";
import type { ManagedGroup } from "../../api/groups";

/**
 * Submits one message for every member of a group.
 *
 * The message does not go anywhere from here: it lands in the administrator's delivery queue, one
 * entry per member, which is what the group has a phone number for. The API refuses a group with no
 * members or with a member who has no number, so this says so before the attempt rather than after
 * it.
 *
 * Rendered for the group's manager only — it is the only viewer who sees the members' phone
 * numbers, so it is the only one whose "everyone has a number" answer means anything.
 */
interface Props {
    group: ManagedGroup;
    onNotice: (message: string) => void;
}

export default function MessageComposer({ group, onNotice }: Props) {
    const submitMessage = useGroupsStore((s) => s.submitMessage);

    const [content, setContent] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const membersWithoutPhone = group.members.filter(
        (member) => !member.phone,
    ).length;

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const result = await submitMessage(group.id, content);
            setContent("");
            onNotice(
                `پیام برای ${result.recipientCount} عضو در صف ارسال مدیر قرار گرفت.`,
            );
        } catch (err) {
            setError(apiErrorMessage(err, "خطا در ثبت پیام گروهی"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <label
                htmlFor={`message-${group.id}`}
                className="mb-2 block text-sm font-semibold text-gray-700"
            >
                پیام برای همه اعضا
            </label>
            <textarea
                id={`message-${group.id}`}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                maxLength={5000}
                rows={4}
                placeholder="متن پیام را بنویسید…"
                className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button
                type="submit"
                disabled={busy || group.members.length === 0}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {busy ? "در حال ثبت…" : "ثبت پیام برای اعضا"}
            </button>

            {error && (
                <div className="mt-2 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                    {error}
                </div>
            )}

            {group.members.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500">
                    برای ثبت پیام، گروه باید عضو داشته باشد.
                </p>
            ) : (
                membersWithoutPhone > 0 && (
                    <p className="mt-2 text-xs text-warning-700">
                        برای ارسال، شماره تلفن همه اعضا باید در حسابشان ثبت شده
                        باشد ({membersWithoutPhone} عضو بدون شماره).
                    </p>
                )
            )}
        </form>
    );
}

// src/pages/groups/MemberList.tsx
import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useGroupsStore } from "../../stores/groupsStore";
import { apiErrorMessage } from "../../lib/apiError";
import { displayName } from "../../lib/displayName";
import type { GroupMember } from "../../api/groups";

/**
 * The members of one group.
 *
 * Phones are present only for the group's own manager — the API withholds them from everyone else
 * (see GroupsService.listMine) — so the column appears when there is something to show rather than
 * as a row of dashes.
 *
 * Removing someone asks first: it is the one action here that takes something away from a person,
 * and until now it happened on a single click.
 */
interface Props {
    groupId: string;
    members: GroupMember[];
    isManager: boolean;
    onNotice: (message: string) => void;
}

export default function MemberList({
    groupId,
    members,
    isManager,
    onNotice,
}: Props) {
    const removeMember = useGroupsStore((s) => s.removeMember);

    const [confirming, setConfirming] = useState<GroupMember | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const close = () => {
        setConfirming(null);
        setError(null);
    };

    const confirm = async () => {
        if (!confirming) return;
        setBusy(true);
        setError(null);
        try {
            await removeMember(groupId, confirming.id);
            onNotice(`${displayName(confirming)} از گروه حذف شد.`);
            setConfirming(null);
        } catch (err) {
            setError(apiErrorMessage(err, "خطا در حذف عضو"));
        } finally {
            setBusy(false);
        }
    };

    if (members.length === 0) {
        return (
            <p className="mb-4 rounded-lg bg-primary-50/60 px-3 py-3 text-sm text-gray-500">
                هنوز عضوی به این گروه اضافه نشده است.
            </p>
        );
    }

    return (
        <>
            <ul className="mb-4 divide-y divide-primary-50">
                {members.map((member) => (
                    <li
                        key={member.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                    >
                        <div className="min-w-0">
                            <span className="font-medium text-gray-800">
                                {displayName(member)}
                            </span>
                            <span
                                className="ms-2 font-mono text-xs text-gray-500"
                                dir="ltr"
                            >
                                {member.username}
                            </span>
                            {member.phone && (
                                <span
                                    className="ms-2 font-mono text-xs text-gray-600"
                                    dir="ltr"
                                >
                                    {member.phone}
                                </span>
                            )}
                        </div>
                        {isManager && (
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setConfirming(member);
                                }}
                                className="text-xs text-error-600 hover:text-error-800"
                            >
                                حذف عضو
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            <ConfirmDialog
                open={!!confirming}
                title="حذف عضو"
                confirmLabel="حذف از گروه"
                busy={busy}
                error={error}
                onConfirm={confirm}
                onCancel={close}
            >
                <p>
                    «<b>{confirming && displayName(confirming)}</b>» از این گروه حذف
                    شود؟ حساب کاربر باقی می‌ماند و می‌توانید بعداً دوباره اضافه‌اش کنید.
                </p>
            </ConfirmDialog>
        </>
    );
}

// src/pages/groups/GroupCard.tsx
import { useState, type FormEvent } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import MemberList from "./MemberList";
import MemberSearch from "./MemberSearch";
import MessageComposer from "./MessageComposer";
import { useGroupsStore } from "../../stores/groupsStore";
import { apiErrorMessage } from "../../lib/apiError";
import { displayName } from "../../lib/displayName";
import { FaEdit, FaTrash } from "react-icons/fa";
import type { ManagedGroup } from "../../api/groups";

/**
 * One group on the groups page: who runs it, who is in it, and everything that may be done to it.
 *
 * A manager and a plain member see the same card with different powers. The manager may add and
 * remove members, compose the group's message, rename it and delete it; a member may read the
 * member list and leave. Which is which is decided by `isManager` — the page passes it in rather
 * than the card re-deriving it, because the page already knows who is signed in.
 *
 * Destructive actions (delete the group, leave it) ask first through components/ConfirmDialog.tsx,
 * and the rename gets a dialog of its own because it needs a field.
 */
interface Props {
    group: ManagedGroup;
    isManager: boolean;
    onNotice: (message: string) => void;
}

export default function GroupCard({ group, isManager, onNotice }: Props) {
    const rename = useGroupsStore((s) => s.rename);
    const remove = useGroupsStore((s) => s.remove);
    const leave = useGroupsStore((s) => s.leave);
    const transfer = useGroupsStore((s) => s.transfer);

    const [draftName, setDraftName] = useState<string | null>(null);
    const [renameBusy, setRenameBusy] = useState(false);
    const [renameError, setRenameError] = useState<string | null>(null);

    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const [confirmingLeave, setConfirmingLeave] = useState(false);
    const [leaveBusy, setLeaveBusy] = useState(false);
    const [leaveError, setLeaveError] = useState<string | null>(null);

    const [confirmingTransfer, setConfirmingTransfer] = useState(false);
    const [transferTo, setTransferTo] = useState("");
    const [transferBusy, setTransferBusy] = useState(false);
    const [transferError, setTransferError] = useState<string | null>(null);

    const submitRename = async (event: FormEvent) => {
        event.preventDefault();
        if (draftName === null) return;
        setRenameBusy(true);
        setRenameError(null);
        try {
            await rename(group.id, draftName.trim());
            setDraftName(null);
            onNotice("نام گروه تغییر کرد.");
        } catch (err) {
            setRenameError(apiErrorMessage(err, "خطا در تغییر نام گروه"));
        } finally {
            setRenameBusy(false);
        }
    };

    const doDelete = async () => {
        setDeleteBusy(true);
        setDeleteError(null);
        try {
            await remove(group.id);
            // The store has already dropped the group, so this card is on its way out; the notice
            // belongs to the page.
            onNotice(`گروه «${group.name}» حذف شد.`);
        } catch (err) {
            setDeleteError(apiErrorMessage(err, "خطا در حذف گروه"));
        } finally {
            setDeleteBusy(false);
        }
    };

    const doLeave = async () => {
        setLeaveBusy(true);
        setLeaveError(null);
        try {
            await leave(group.id);
            onNotice(`از گروه «${group.name}» خارج شدید.`);
        } catch (err) {
            setLeaveError(apiErrorMessage(err, "خطا در ترک گروه"));
        } finally {
            setLeaveBusy(false);
        }
    };

    const doTransfer = async () => {
        if (!transferTo) return;
        setTransferBusy(true);
        setTransferError(null);
        try {
            const member = group.members.find((item) => item.id === transferTo);
            await transfer(group.id, transferTo);
            setConfirmingTransfer(false);
            onNotice(
                `مدیریت گروه «${group.name}» به ${member ? displayName(member) : "عضو انتخابی"} منتقل شد.` +
                " شما اکنون عضو این گروه هستید.",
            );
        } catch (err) {
            setTransferError(apiErrorMessage(err, "خطا در انتقال مدیریت"));
        } finally {
            setTransferBusy(false);
        }
    };

    return (
        <section className="rounded-xl border border-primary-100 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-primary-800">
                        {group.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                        مدیر گروه: {group.managerName} · {group.members.length} عضو
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {isManager ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setRenameError(null);
                                    setDraftName(group.name);
                                }}
                                className="rounded-lg p-2 text-primary-700 hover:bg-primary-50"
                                title="تغییر نام گروه"
                                aria-label="تغییر نام گروه"
                            >
                                <FaEdit size={14} />
                            </button>
                            {group.members.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTransferError(null);
                                        setTransferTo("");
                                        setConfirmingTransfer(true);
                                    }}
                                    className="rounded-lg px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-50"
                                >
                                    انتقال مدیریت
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteError(null);
                                    setConfirmingDelete(true);
                                }}
                                className="rounded-lg p-2 text-error-600 hover:bg-error-50"
                                title="حذف گروه"
                                aria-label="حذف گروه"
                            >
                                <FaTrash size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                                عضو گروه
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setLeaveError(null);
                                    setConfirmingLeave(true);
                                }}
                                className="text-xs text-error-600 hover:text-error-800"
                            >
                                ترک گروه
                            </button>
                        </>
                    )}
                </div>
            </div>

            <MemberList
                groupId={group.id}
                members={group.members}
                isManager={isManager}
                onNotice={onNotice}
            />

            {isManager && (
                <>
                    <MemberSearch groupId={group.id} onNotice={onNotice} />
                    <MessageComposer group={group} onNotice={onNotice} />
                </>
            )}

            {/* Rename */}
            <Modal
                open={draftName !== null}
                onClose={() => setDraftName(null)}
                title="تغییر نام گروه"
            >
                <form onSubmit={submitRename} className="space-y-4">
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor={`group-name-${group.id}`}
                        >
                            نام گروه
                        </label>
                        <input
                            id={`group-name-${group.id}`}
                            value={draftName ?? ""}
                            onChange={(event) => setDraftName(event.target.value)}
                            required
                            maxLength={100}
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                        />
                    </div>

                    {renameError && (
                        <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                            {renameError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setDraftName(null)}
                            className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            disabled={renameBusy}
                            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
                        >
                            {renameBusy ? "در حال ذخیره…" : "ذخیره"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={confirmingDelete}
                title="حذف گروه"
                confirmLabel="حذف گروه"
                busy={deleteBusy}
                busyLabel="در حال حذف…"
                error={deleteError}
                onConfirm={doDelete}
                onCancel={() => setConfirmingDelete(false)}
            >
                <p>
                    گروه «<b>{group.name}</b>» و عضویت {group.members.length} نفر در آن
                    حذف شود؟ اعضا دیگر این گروه را نمی‌بینند و این کار بازگشت‌پذیر
                    نیست.
                </p>
                <p className="text-xs text-gray-500">
                    پیام‌هایی که در صف ارسال هستند باقی می‌مانند؛ فهرست صف با نام همین
                    گروه ثبت شده است.
                </p>
            </ConfirmDialog>

            <ConfirmDialog
                open={confirmingLeave}
                title="ترک گروه"
                confirmLabel="ترک گروه"
                busy={leaveBusy}
                busyLabel="در حال خروج…"
                error={leaveError}
                onConfirm={doLeave}
                onCancel={() => setConfirmingLeave(false)}
            >
                <p>
                    از گروه «<b>{group.name}</b>» خارج شوید؟ تا زمانی که مدیر گروه
                    دوباره اضافه‌تان نکند، این گروه را نمی‌بینید.
                </p>
            </ConfirmDialog>

            {/* Transfer. A select rather than a confirm: the answer is a person, not yes or no. */}
            <Modal
                open={confirmingTransfer}
                onClose={() => setConfirmingTransfer(false)}
                title="انتقال مدیریت گروه"
            >
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-gray-700">
                        مدیریت «<b>{group.name}</b>» به کدام عضو واگذار شود؟ شما پس از
                        این، عضو عادی این گروه می‌مانید و می‌توانید از آن خارج شوید.
                    </p>

                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor={`group-manager-${group.id}`}
                        >
                            عضو جدید
                        </label>
                        <select
                            id={`group-manager-${group.id}`}
                            value={transferTo}
                            onChange={(event) => setTransferTo(event.target.value)}
                            required
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500"
                        >
                            <option value="">— انتخاب کنید —</option>
                            {group.members.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {displayName(member)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {transferError && (
                        <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                            {transferError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setConfirmingTransfer(false)}
                            className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                        >
                            انصراف
                        </button>
                        <button
                            type="button"
                            onClick={doTransfer}
                            disabled={transferBusy || !transferTo}
                            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
                        >
                            {transferBusy ? "در حال انتقال…" : "انتقال مدیریت"}
                        </button>
                    </div>
                </div>
            </Modal>
        </section>
    );
}

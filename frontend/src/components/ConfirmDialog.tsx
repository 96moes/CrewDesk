// src/components/ConfirmDialog.tsx
import type { ReactNode } from "react";
import Modal from "./Modal";

/**
 * The one confirmation dialog for a destructive action.
 *
 * It exists so the group page's three of them ("remove this member", "delete this group", "leave
 * this group") cannot drift apart, and so each one says the same three things: what is about to
 * happen, what it costs, and a button that names the act. It stays open while the caller's request
 * runs and shows the failure inside itself, because the reason a delete did not happen belongs
 * next to the button that tried.
 */
interface Props {
    open: boolean;
    title: string;
    /** The question, and anything worth knowing before answering it. */
    children: ReactNode;
    /** The verb on the confirm button, e.g. "حذف". */
    confirmLabel: string;
    busy?: boolean;
    busyLabel?: string;
    error?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    children,
    confirmLabel,
    busy = false,
    busyLabel = "در حال انجام…",
    error,
    onConfirm,
    onCancel,
}: Props) {
    return (
        <Modal open={open} onClose={onCancel} title={title}>
            <div className="mb-4 space-y-2 text-sm leading-6 text-gray-700">
                {children}
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                >
                    انصراف
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={busy}
                    className="rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-60"
                >
                    {busy ? busyLabel : confirmLabel}
                </button>
            </div>
        </Modal>
    );
}

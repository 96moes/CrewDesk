// src/components/Modal.tsx
import { type ReactNode, useEffect, useId, useRef } from "react";
import { HiX } from "react-icons/hi";

interface Props {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export default function Modal({ open, title, onClose, children }: Props) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);

    // Lock scroll while open.
    useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, [open]);

    // Close on Escape, and move focus into the dialog so keyboard users are not left behind it.
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        panelRef.current?.focus();

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-primary-950/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="animate-rise w-full max-w-md rounded-2xl border border-primary-100 bg-white p-6 shadow-[var(--shadow-overlay)] outline-none"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-start justify-between gap-4">
                    <h2 id={titleId} className="text-lg font-bold tracking-tight text-primary-900">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="-mr-1 -mt-1 rounded-xl p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        aria-label="بستن"
                    >
                        <HiX size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

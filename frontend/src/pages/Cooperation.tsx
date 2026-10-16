// src/pages/Cooperation.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { FaHandsHelping, FaRedo } from "react-icons/fa";
import PageHeader from "../components/PageHeader";
import {
    listOpportunities,
    isExternalAction,
    DEFAULT_ACTION_LABEL,
    type Opportunity,
} from "../api/opportunities";

/**
 * Public cooperation page, fed by `GET /opportunities`.
 *
 * The cards used to be a `const OPPORTUNITIES` array in this file, so every wording change
 * was a frontend deploy. They now come from the database and are edited in the management
 * panel, which is why all three non-happy states matter: a fresh install has no
 * opportunities at all, so "empty" is the normal first impression rather than an edge case.
 */
export default function Cooperation() {
    const [items, setItems] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        listOpportunities()
            .then((data) => {
                if (cancelled) return;
                setItems(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(
                    err?.response?.data?.message ??
                        "خطا در بارگذاری فرصت‌های همکاری",
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    /** Back to the skeleton, then a fresh request. */
    const retry = () => {
        setLoading(true);
        setError(null);
        setReloadKey((k) => k + 1);
    };

    return (
        <div>
            <PageHeader
                title="فرصت‌های همکاری"
                subtitle="راه‌های مختلفی برای همراهی با قوم سلمان وجود دارد."
            />

            {/* Loading */}
            {loading && (
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-40 animate-pulse rounded-xl border border-primary-100 bg-white/60"
                        />
                    ))}
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="rounded-xl border border-error-50 bg-error-50/60 p-6 text-center">
                    <p className="text-sm text-error-700">{error}</p>
                    <button
                        type="button"
                        onClick={retry}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-error-700 shadow-[var(--shadow-card)] transition-colors hover:bg-error-50"
                    >
                        <FaRedo size={12} />
                        تلاش دوباره
                    </button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && items.length === 0 && (
                <div className="rounded-xl border border-dashed border-primary-200 bg-white/60 p-12 text-center">
                    <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-xl text-primary-600">
                        <FaHandsHelping />
                    </span>
                    <p className="text-sm font-medium text-primary-900">
                        هنوز فرصت همکاری ثبت نشده است.
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        فرصت‌های همکاری از پنل مدیریت اضافه می‌شوند.
                    </p>
                </div>
            )}

            {/* Opportunities */}
            {!loading && !error && items.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {items.map((o) => {
                        const label =
                            o.actionLabel?.trim() || DEFAULT_ACTION_LABEL;
                        const buttonClass =
                            "mt-4 inline-flex self-start rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800";
                        const external = isExternalAction(o.actionUrl);

                        return (
                            <div
                                key={o.id}
                                className="flex flex-col rounded-xl border border-primary-100 bg-white p-6"
                            >
                                <h3 className="mb-2 text-lg font-semibold text-primary-800">
                                    {o.title}
                                </h3>
                                {o.description && (
                                    <p className="text-sm leading-7 text-gray-600">
                                        {o.description}
                                    </p>
                                )}

                                {/*
                                 * The button is a link, never a dead end: an opportunity may point
                                 * at its own destination, and when it does not, the sign-up form
                                 * is the one in-app way to offer help.
                                 */}
                                {o.actionUrl ? (
                                    <a
                                        href={o.actionUrl}
                                        {...(external
                                            ? {
                                                  target: "_blank",
                                                  rel: "noopener noreferrer",
                                              }
                                            : {})}
                                        className={buttonClass}
                                    >
                                        {label}
                                    </a>
                                ) : (
                                    <Link to="/register" className={buttonClass}>
                                        {label}
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

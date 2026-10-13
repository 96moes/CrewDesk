// src/pages/Gallery.tsx
import { useEffect, useMemo, useState } from "react";
import { FaImages, FaPlay, FaExternalLinkAlt, FaRedo } from "react-icons/fa";
import PageHeader from "../components/PageHeader";
import { listMedia, type MediaItem } from "../api/media";

type Tab = "photos" | "videos";

/**
 * Public gallery, fed by `GET /media`.
 *
 * The page previously rendered hardcoded placeholder images and two Rick Astley videos.
 * It now loads real content from the database, which is why all three non-happy states
 * matter: a brand-new install has no media at all, so "empty" is the normal first
 * impression rather than an edge case.
 */
export default function Gallery() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("photos");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        listMedia()
            .then((data) => {
                if (cancelled) return;
                setItems(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(
                    err?.response?.data?.message ?? "خطا در بارگذاری گالری",
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    const photos = useMemo(() => items.filter((i) => i.kind === "photo"), [items]);
    const videos = useMemo(() => items.filter((i) => i.kind === "video"), [items]);

    // Land on whichever tab actually has content, so a gallery with only videos does not
    // open on an empty photo grid.
    useEffect(() => {
        if (loading || items.length === 0) return;
        if (photos.length === 0 && videos.length > 0) setTab("videos");
        if (videos.length === 0 && photos.length > 0) setTab("photos");
    }, [loading, items.length, photos.length, videos.length]);

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: "photos", label: "تصاویر", count: photos.length },
        { id: "videos", label: "ویدیوها", count: videos.length },
    ];

    const visible = tab === "photos" ? photos : videos;

    return (
        <div>
            <PageHeader title="ویدیو و عکس" subtitle="گالری تصاویر و ویدیوهای قوم سلمان." />

            {/* Tabs */}
            <div
                role="tablist"
                aria-label="نوع محتوا"
                className="mb-6 flex gap-1 rounded-xl border border-primary-100/80 bg-white/70 p-1 shadow-[var(--shadow-card)] backdrop-blur sm:w-fit"
            >
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
                            tab === t.id
                                ? "bg-gradient-to-l from-primary-600 to-primary-700 text-white shadow-[var(--shadow-card)]"
                                : "text-gray-600 hover:bg-primary-50 hover:text-primary-800"
                        }`}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                    tab === t.id
                                        ? "bg-white/20 text-white"
                                        : "bg-primary-100 text-primary-800"
                                }`}
                            >
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-56 animate-pulse rounded-2xl border border-primary-100/80 bg-white/60"
                        />
                    ))}
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="rounded-2xl border border-error-50 bg-error-50/60 p-6 text-center">
                    <p className="text-sm text-error-700">{error}</p>
                    <button
                        type="button"
                        onClick={() => setReloadKey((k) => k + 1)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-error-700 shadow-[var(--shadow-card)] transition-colors hover:bg-error-50"
                    >
                        <FaRedo size={12} />
                        تلاش دوباره
                    </button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && visible.length === 0 && (
                <div className="rounded-2xl border border-dashed border-primary-200 bg-white/60 p-12 text-center">
                    <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-xl text-primary-600">
                        <FaImages />
                    </span>
                    <p className="text-sm font-medium text-primary-900">
                        {items.length === 0
                            ? "هنوز محتوایی در گالری ثبت نشده است."
                            : tab === "photos"
                              ? "تصویری ثبت نشده است."
                              : "ویدیویی ثبت نشده است."}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        محتوای گالری از پنل مدیریت اضافه می‌شود.
                    </p>
                </div>
            )}

            {/* Photos */}
            {!loading && !error && tab === "photos" && photos.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {photos.map((p) => {
                        const href = p.linkUrl || p.url;
                        const body = (
                            <>
                                <div className="relative aspect-[3/2] overflow-hidden bg-primary-50">
                                    <img
                                        src={p.thumbnailUrl || p.url}
                                        alt={p.title}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    {p.linkUrl && (
                                        <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-xs text-primary-800 shadow-[var(--shadow-card)]">
                                            <FaExternalLinkAlt size={11} />
                                        </span>
                                    )}
                                </div>
                                <figcaption className="p-4">
                                    <p className="text-sm font-semibold text-primary-900">
                                        {p.title}
                                    </p>
                                    {p.description && (
                                        <p className="mt-1 text-xs leading-6 text-gray-500">
                                            {p.description}
                                        </p>
                                    )}
                                </figcaption>
                            </>
                        );

                        const className =
                            "group block overflow-hidden rounded-2xl border border-primary-100/80 bg-white/80 shadow-[var(--shadow-card)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]";

                        return p.linkUrl ? (
                            <a
                                key={p.id}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={className}
                            >
                                {body}
                            </a>
                        ) : (
                            <figure key={p.id} className={className}>
                                {body}
                            </figure>
                        );
                    })}
                </div>
            )}

            {/* Videos */}
            {!loading && !error && tab === "videos" && videos.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {videos.map((v) => (
                        <div
                            key={v.id}
                            className="group overflow-hidden rounded-2xl border border-primary-100/80 bg-white/80 shadow-[var(--shadow-card)] backdrop-blur transition-shadow duration-200 hover:shadow-[var(--shadow-raised)]"
                        >
                            <div className="relative aspect-video bg-primary-900">
                                {v.embedUrl ? (
                                    <iframe
                                        src={v.embedUrl}
                                        title={v.title}
                                        loading="lazy"
                                        className="h-full w-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    /*
                                     * A video whose host the API could not parse. The API rejects
                                     * these on save, so this is a safety net for rows written before
                                     * that rule existed — a link out beats a broken player.
                                     */
                                    <a
                                        href={v.linkUrl || v.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-full w-full flex-col items-center justify-center gap-2 text-primary-100 transition-colors hover:bg-primary-800"
                                    >
                                        <FaPlay size={28} />
                                        <span className="text-xs">مشاهده ویدیو</span>
                                    </a>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-semibold text-primary-900">{v.title}</p>
                                {v.description && (
                                    <p className="mt-1 text-xs leading-6 text-gray-500">
                                        {v.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

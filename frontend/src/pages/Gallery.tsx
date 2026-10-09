// src/pages/Gallery.tsx
import { useState } from "react";
import PageHeader from "../components/PageHeader";

const PHOTOS = Array.from({ length: 6 }).map((_, i) => ({
    id: i + 1,
    title: `تصویر شماره ${i + 1}`,
    src: `https://picsum.photos/seed/qom-salman-${i + 1}/600/400`,
}));

const VIDEOS = [
    { id: "v1", title: "معرفی قوم سلمان", youtubeId: "dQw4w9WgXcQ" },
    { id: "v2", title: "گزارش رویداد اخیر", youtubeId: "dQw4w9WgXcQ" },
];

type Tab = "photos" | "videos";

export default function Gallery() {
    const [tab, setTab] = useState<Tab>("photos");

    return (
        <div>
            <PageHeader title="ویدیو و عکس" subtitle="گالری تصاویر و ویدیوهای قوم سلمان." />

            <div className="mb-6 flex gap-2 border-b border-primary-100">
                <button
                    onClick={() => setTab("photos")}
                    className={`px-4 py-2 text-sm font-medium ${tab === "photos"
                            ? "border-b-2 border-primary-700 text-primary-800"
                            : "text-gray-600 hover:text-primary-700"
                        }`}
                >
                    تصاویر
                </button>
                <button
                    onClick={() => setTab("videos")}
                    className={`px-4 py-2 text-sm font-medium ${tab === "videos"
                            ? "border-b-2 border-primary-700 text-primary-800"
                            : "text-gray-600 hover:text-primary-700"
                        }`}
                >
                    ویدیوها
                </button>
            </div>

            {tab === "photos" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {PHOTOS.map((p) => (
                        <figure
                            key={p.id}
                            className="overflow-hidden rounded-xl border border-primary-100 bg-white"
                        >
                            <img src={p.src} alt={p.title} className="h-48 w-full object-cover" />
                            <figcaption className="p-3 text-sm text-gray-600">{p.title}</figcaption>
                        </figure>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {VIDEOS.map((v) => (
                        <div
                            key={v.id}
                            className="overflow-hidden rounded-xl border border-primary-100 bg-white"
                        >
                            <div className="aspect-video">
                                <iframe
                                    src={`https://www.youtube.com/embed/${v.youtubeId}`}
                                    title={v.title}
                                    className="h-full w-full"
                                    allowFullScreen
                                />
                            </div>
                            <div className="p-3 text-sm text-gray-600">{v.title}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
// src/pages/Home.tsx
import { Link } from "react-router";
import type { ReactNode } from "react";
import {
    FaBookOpen,
    FaHandHoldingHeart,
    FaHandsHelping,
    FaImages,
    FaRegCalendarCheck,
    FaUsers,
    FaArrowLeft,
} from "react-icons/fa";

interface Card {
    to: string;
    title: string;
    desc: string;
    icon: ReactNode;
}

const CARDS: Card[] = [
    {
        to: "/about",
        title: "معرفی درباره ما",
        desc: "با اهداف، آرمان‌ها و تیم قوم سلمان آشنا شوید.",
        icon: <FaUsers />,
    },
    {
        to: "/gallery",
        title: "ویدیو و عکس",
        desc: "گالری تصاویر و ویدیوهای فعالیت‌های ما.",
        icon: <FaImages />,
    },
    {
        to: "/education",
        title: "آموزش‌ها",
        desc: "دوره‌ها و کارگاه‌های تخصصی معارف مهدوی.",
        icon: <FaBookOpen />,
    },
    {
        to: "/cooperation",
        title: "فرصت‌های همکاری",
        desc: "راه‌های همراهی با ما در مسیر زمینه‌سازی.",
        icon: <FaHandsHelping />,
    },
    {
        to: "/donations",
        title: "کمک‌های مردمی",
        desc: "حمایت مالی و معنوی از فعالیت‌های ما.",
        icon: <FaHandHoldingHeart />,
    },
    {
        to: "/events",
        title: "رویدادهای برگزار شده",
        desc: "مروری بر رویدادها و نشست‌های گذشته.",
        icon: <FaRegCalendarCheck />,
    },
];

export default function Home() {
    return (
        <div>
            {/* Hero */}
            <section className="relative mb-14 overflow-hidden rounded-3xl bg-gradient-to-bl from-primary-700 via-primary-800 to-primary-900 p-8 text-white shadow-[var(--shadow-overlay)] sm:p-12">
                {/* Decorative arcs, purely cosmetic and hidden from assistive tech. */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-24 -top-32 h-72 w-72 rounded-full border border-white/10" />
                    <div className="absolute -left-12 -top-20 h-72 w-72 rounded-full border border-white/[0.07]" />
                    <div className="absolute -bottom-40 -right-20 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl" />
                    <div className="absolute right-10 top-10 h-1.5 w-1.5 rounded-full bg-primary-400" />
                </div>

                <div className="relative max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-primary-100 ring-1 ring-inset ring-white/15 backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                        در مسیر زمینه‌سازی ظهور
                    </span>

                    <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">
                        به قوم سلمان خوش آمدید
                    </h1>

                    <p className="mt-4 max-w-xl leading-8 text-primary-100/90">
                        ما جمعی از منتظران امام زمان (عج) هستیم که با تکیه بر مبانی اسلامی و
                        معارف آخرزمان، در مسیر زمینه‌سازی ظهور و خدمت به جامعه گام برمی‌داریم.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            to="/donations"
                            className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary-800 shadow-[var(--shadow-raised)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-overlay)]"
                        >
                            <FaHandHoldingHeart className="text-primary-600" size={15} />
                            کمک می‌کنم
                        </Link>
                        <Link
                            to="/about"
                            className="group inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:border-white/40 hover:bg-white/10"
                        >
                            بیشتر بدانید
                            <FaArrowLeft
                                size={12}
                                className="transition-transform duration-200 group-hover:-translate-x-1"
                            />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Cards */}
            <section>
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-primary-900">
                            بخش‌های سایت
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            از کجا شروع کنیم؟
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {CARDS.map((c) => (
                        <Link
                            key={c.to}
                            to={c.to}
                            className="group relative flex flex-col rounded-2xl border border-primary-100/80 bg-white/80 p-6 shadow-[var(--shadow-card)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[var(--shadow-raised)]"
                        >
                            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-lg text-primary-700 ring-1 ring-inset ring-primary-100 transition-colors duration-200 group-hover:bg-primary-100 group-hover:text-primary-800">
                                {c.icon}
                            </span>

                            <h3 className="text-base font-semibold text-primary-900">
                                {c.title}
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-gray-500">{c.desc}</p>

                            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                مشاهده
                                <FaArrowLeft size={10} />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}

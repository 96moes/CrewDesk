// src/pages/Education.tsx
import { useState } from "react";
import PageHeader from "../components/PageHeader";

type Category = "all" | "mahdavi" | "skills" | "media";

interface Course {
    id: number;
    title: string;
    category: Exclude<Category, "all">;
    level: "مقدماتی" | "متوسط" | "پیشرفته";
    duration: string;
    desc: string;
    instructor: string;
}

const COURSES: Course[] = [
    {
        id: 1,
        title: "مبانی معارف مهدوی",
        category: "mahdavi",
        level: "مقدماتی",
        duration: "۸ جلسه",
        desc: "آشنایی با مفاهیم انتظار، غیبت و وظایف منتظران در دوران غیبت امام زمان (عج).",
        instructor: "حجت‌الاسلام محمدی",
    },
    {
        id: 2,
        title: "نشانه‌های آخرزمان",
        category: "mahdavi",
        level: "متوسط",
        duration: "۱۰ جلسه",
        desc: "بررسی دقیق نشانه‌های ظهور و تحلیل روایات مربوط به آخرزمان.",
        instructor: "حجت‌الاسلام رضایی",
    },
    {
        id: 3,
        title: "مهارت‌های تیم‌سازی فرهنگی",
        category: "skills",
        level: "مقدماتی",
        duration: "۶ جلسه",
        desc: "آموزش اصول کار تیمی، رهبری و مدیریت فعالیت‌های فرهنگی در مجموعه‌های مهدوی.",
        instructor: "استاد کریمی",
    },
    {
        id: 4,
        title: "تولید محتوای رسانه‌ای",
        category: "media",
        level: "متوسط",
        duration: "۱۲ جلسه",
        desc: "آموزش تولید ویدیو، پادکست و محتوای متنی با محوریت معارف مهدوی.",
        instructor: "استاد نوری",
    },
    {
        id: 5,
        title: "سواد رسانه‌ای و فضای مجازی",
        category: "media",
        level: "پیشرفته",
        duration: "۸ جلسه",
        desc: "تحلیل جریان‌های رسانه‌ای و روش‌های تبلیغ مؤثر معارف دینی در فضای مجازی.",
        instructor: "استاد صادقی",
    },
    {
        id: 6,
        title: "خطابه و مداحی مهدوی",
        category: "mahdavi",
        level: "مقدماتی",
        duration: "۶ جلسه",
        desc: "اصول سخنرانی و مداحی در مناسبت‌های مهدوی با رعایت آداب و معارف.",
        instructor: "حاج آقای موسوی",
    },
];

const CATEGORIES: { key: Category; label: string }[] = [
    { key: "all", label: "همه" },
    { key: "mahdavi", label: "معارف مهدوی" },
    { key: "skills", label: "مهارت‌های عمومی" },
    { key: "media", label: "رسانه و محتوا" },
];

const LEVEL_COLORS: Record<Course["level"], string> = {
    "مقدماتی": "bg-success-50 text-success-700",
    "متوسط": "bg-warning-50 text-warning-700",
    "پیشرفته": "bg-primary-100 text-primary-800",
};

export default function Education() {
    const [category, setCategory] = useState<Category>("all");

    const visible =
        category === "all"
            ? COURSES
            : COURSES.filter((c) => c.category === category);

    return (
        <div>
            <PageHeader
                title="آموزش‌ها"
                subtitle="دوره‌ها و کارگاه‌های تخصصی قوم سلمان در حوزه معارف مهدوی و مهارت‌های فرهنگی."
            />

            {/* Category filters */}
            <div className="mb-6 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                    <button
                        key={c.key}
                        onClick={() => setCategory(c.key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${category === c.key
                                ? "bg-primary-700 text-white"
                                : "bg-white text-primary-700 border border-primary-200 hover:bg-primary-50"
                            }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Courses grid */}
            {visible.length === 0 ? (
                <p className="text-gray-500">دوره‌ای در این دسته یافت نشد.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {visible.map((course) => (
                        <article
                            key={course.id}
                            className="flex flex-col rounded-xl border border-primary-100 bg-white p-6 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                        >
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_COLORS[course.level]}`}
                                >
                                    {course.level}
                                </span>
                                <span className="text-xs text-gray-500">⏱ {course.duration}</span>
                            </div>

                            <h3 className="mb-2 text-lg font-semibold text-primary-800">
                                {course.title}
                            </h3>

                            <p className="flex-1 text-sm leading-7 text-gray-600">
                                {course.desc}
                            </p>

                            <div className="mt-4 flex items-center justify-between border-t border-primary-50 pt-3">
                                <span className="text-xs text-gray-500">
                                    👤 {course.instructor}
                                </span>
                                <button className="rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-800">
                                    ثبت‌نام
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* CTA */}
            <section className="mt-10 rounded-2xl bg-gradient-to-l from-primary-800 to-primary-600 p-8 text-center text-white">
                <h2 className="text-xl font-bold">می‌خواهید دوره‌ای برگزار کنید؟</h2>
                <p className="mt-2 text-sm leading-7 text-primary-100">
                    اگر تخصصی در حوزه معارف مهدوی یا مهارت‌های فرهنگی دارید، می‌توانید به عنوان
                    مدرس با قوم سلمان همکاری کنید.
                </p>
                <a
                    href="/cooperation"
                    className="mt-5 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-primary-800 hover:bg-primary-50"
                >
                    درخواست همکاری به عنوان مدرس
                </a>
            </section>
        </div>
    );
}
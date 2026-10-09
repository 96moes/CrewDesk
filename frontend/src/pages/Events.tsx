// src/pages/Events.tsx
import PageHeader from "../components/PageHeader";

const EVENTS = [
    {
        id: 1,
        title: "همایش سالانه منتظران",
        date: "۱۴۰۳/۰۵/۱۲",
        location: "تهران، سالن اصلی",
        desc: "گردهمایی سالانه اعضای قوم سلمان و تقدیر از تلاش‌های داوطلبان.",
    },
    {
        id: 2,
        title: "نشست تخصصی معارف آخرزمان",
        date: "۱۴۰۳/۰۳/۲۵",
        location: "قم، مدرسه علمیه",
        desc: "بررسی نشانه‌های آخرزمان و وظایف منتظران در دوران غیبت.",
    },
    {
        id: 3,
        title: "کمپین خدمت به محرومان",
        date: "۱۴۰۲/۱۲/۱۰",
        location: "اصفهان، مرکز فرهنگی",
        desc: "توزیع بسته‌های معیشتی و کمک به خانواده‌های نیازمند.",
    },
];

export default function Events() {
    return (
        <div>
            <PageHeader
                title="رویدادهای برگزار شده"
                subtitle="مروری بر مهم‌ترین رویدادهای گذشته قوم سلمان."
            />
            <div className="space-y-4">
                {EVENTS.map((e) => (
                    <article
                        key={e.id}
                        className="rounded-xl border border-primary-100 bg-white p-6 transition hover:border-primary-200 hover:shadow-md"
                    >
                        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-primary-700">
                                {e.date}
                            </span>
                            <span>📍 {e.location}</span>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-primary-800">{e.title}</h3>
                        <p className="text-sm leading-7 text-gray-600">{e.desc}</p>
                    </article>
                ))}
            </div>
        </div>
    );
}
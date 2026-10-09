// src/pages/Dashboard.tsx
import PageHeader from "../components/PageHeader";

const STATS = [
    { label: "اعضای فعال", value: "۱٬۲۴۵" },
    { label: "پروژه‌های فعال", value: "۸" },
    { label: "کمک‌های دریافتی", value: "۲۳۴ میلیون" },
    { label: "رویدادها", value: "۱۷" },
];

export default function Dashboard() {
    return (
        <div>
            <PageHeader title="داشبورد" subtitle="نمای کلی از وضعیت قوم سلمان." />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STATS.map((s) => (
                    <div key={s.label} className="rounded-xl border border-primary-100 bg-white p-5">
                        <p className="text-sm text-gray-500">{s.label}</p>
                        <p className="mt-2 text-2xl font-bold text-primary-800">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 rounded-xl border border-primary-100 bg-white p-6">
                <h2 className="mb-3 text-lg font-semibold text-primary-800">فعالیت‌های اخیر</h2>
                <ul className="divide-y divide-primary-50">
                    {[
                        "ثبت‌نام ۱۲ داوطلب جدید در هفته گذشته",
                        "افزودن پروژه «کمک به خانواده‌های نیازمند»",
                        "بروزرسانی اطلاعات رویدادهای سالانه",
                        "دریافت ۵ کمک مردمی در ۲۴ ساعت اخیر",
                    ].map((t, i) => (
                        <li key={i} className="py-3 text-sm text-gray-700">{t}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
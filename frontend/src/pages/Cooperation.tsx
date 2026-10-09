// src/pages/Cooperation.tsx
import PageHeader from "../components/PageHeader";

const OPPORTUNITIES = [
    {
        id: 1,
        title: "همکاری داوطلبانه",
        desc: "پیوستن به تیم داوطلبان قوم سلمان در رویدادها و برنامه‌های فرهنگی.",
    },
    {
        id: 2,
        title: "همکاری تخصصی",
        desc: "ارائه خدمات تخصصی در حوزه‌های فنی، طراحی، رسانه و معارف مهدوی.",
    },
    {
        id: 3,
        title: "همکاری مالی",
        desc: "حمایت مالی از پروژه‌ها، رویدادها و برنامه‌های خدمت‌رسانی.",
    },
    {
        id: 4,
        title: "همکاری سازمانی",
        desc: "ایجاد تفاهم‌نامه با هیئت‌ها، مساجد و سازمان‌های هم‌سو.",
    },
];

export default function Cooperation() {
    return (
        <div>
            <PageHeader
                title="فرصت‌های همکاری"
                subtitle="راه‌های مختلفی برای همراهی با قوم سلمان وجود دارد."
            />
            <div className="grid gap-4 md:grid-cols-2">
                {OPPORTUNITIES.map((o) => (
                    <div key={o.id} className="rounded-xl border border-primary-100 bg-white p-6">
                        <h3 className="mb-2 text-lg font-semibold text-primary-800">{o.title}</h3>
                        <p className="text-sm leading-7 text-gray-600">{o.desc}</p>
                        <button className="mt-4 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800">
                            درخواست همکاری
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
// src/pages/About.tsx
import PageHeader from "../components/PageHeader";

export default function About() {
    return (
        <div>
            <PageHeader
                title="معرفی درباره ما"
                subtitle="با تاریخچه، آرمان‌ها و تیم قوم سلمان آشنا شوید."
            />
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-primary-100 bg-white p-6">
                    <h2 className="mb-3 text-lg font-semibold text-primary-800">داستان ما</h2>
                    <p className="leading-8 text-gray-600">
                        «قوم سلمان» با الهام از سیره سلمان فارسی و با هدف زمینه‌سازی برای ظهور
                        امام زمان (عج) شکل گرفته است. ما جمعی از جوانان و دلسوزان هستیم که
                        تلاش می‌کنیم با فعالیت‌های فرهنگی، اجتماعی و خدمت‌رسانی، در مسیر
                        آخرزمان و انتظار فعال گام برداریم.
                    </p>
                </div>
                <div className="rounded-xl border border-primary-100 bg-white p-6">
                    <h2 className="mb-3 text-lg font-semibold text-primary-800">چشم‌انداز</h2>
                    <p className="leading-8 text-gray-600">
                        تبدیل شدن به یکی از مراجع اصلی در حوزه معارف مهدوی و آخرزمان، و ایجاد
                        شبکه‌ای از منتظران فعال در سراسر کشور که با عمل به وظایف دوران غیبت،
                        زمینه‌ساز ظهور باشند.
                    </p>
                </div>
                <div className="rounded-xl border border-primary-100 bg-white p-6 md:col-span-2">
                    <h2 className="mb-3 text-lg font-semibold text-primary-800">اهداف ما</h2>
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {[
                            "ترویج معارف مهدوی و آخرزمان",
                            "خدمت به محرومان و نیازمندان",
                            "ایجاد شبکه همکاری میان منتظران",
                            "برگزاری رویدادها و نشست‌های تخصصی",
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-600">
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                                <span className="leading-7">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
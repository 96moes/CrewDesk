// src/pages/Home.tsx
import { Link } from "react-router";

const CARDS = [
    { to: "/about", title: "معرفی درباره ما", desc: "با اهداف، آرمان‌ها و تیم قوم سلمان آشنا شوید." },
    { to: "/gallery", title: "ویدیو و عکس", desc: "گالری تصاویر و ویدیوهای فعالیت‌های ما." },
    { to: "/education", title: "آموزش‌ها", desc: "دوره‌ها و کارگاه‌های تخصصی معارف مهدوی." },
    { to: "/cooperation", title: "فرصت‌های همکاری", desc: "راه‌های همراهی با ما در مسیر زمینه‌سازی." },
    { to: "/donations", title: "کمک‌های مردمی", desc: "حمایت مالی و معنوی از فعالیت‌های ما." },
    { to: "/events", title: "رویدادهای برگزار شده", desc: "مروری بر رویدادها و نشست‌های گذشته." },
];

export default function Home() {
    return (
        <div>
            {/* Hero */}
            <section className="mb-12 rounded-2xl bg-gradient-to-l from-primary-800 to-primary-600 p-10 text-white shadow-lg">
                <h1 className="text-3xl font-bold md:text-4xl">
                    به قوم سلمان خوش آمدید
                </h1>
                <p className="mt-3 max-w-2xl leading-8 text-primary-100">
                    ما جمعی از منتظران امام زمان (عج) هستیم که با تکیه بر مبانی اسلامی و
                    معارف آخرزمان، در مسیر زمینه‌سازی ظهور و خدمت به جامعه گام برمی‌داریم.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        to="/donations"
                        className="rounded-lg bg-white px-5 py-2.5 font-medium text-primary-800 hover:bg-primary-50"
                    >
                        کمک می‌کنم
                    </Link>
                    <Link
                        to="/about"
                        className="rounded-lg border border-white/40 px-5 py-2.5 font-medium text-white hover:bg-white/10"
                    >
                        بیشتر بدانید
                    </Link>
                </div>
            </section>

            {/* Cards */}
            <section>
                <h2 className="mb-6 text-xl font-bold text-primary-800">بخش‌های سایت</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {CARDS.map((c) => (
                        <Link
                            key={c.to}
                            to={c.to}
                            className="rounded-xl border border-primary-100 bg-white p-6 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                        >
                            <h3 className="text-lg font-semibold text-primary-800">{c.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-gray-600">{c.desc}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
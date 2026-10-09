// src/pages/Donations.tsx
import PageHeader from "../components/PageHeader";

export default function Donations() {
    return (
        <div>
            <PageHeader
                title="کمک‌های مردمی"
                subtitle="هر کمک شما، گامی در جهت زمینه‌سازی ظهور است."
            />

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-primary-100 bg-white p-6">
                    <h2 className="mb-3 text-lg font-semibold text-primary-800">پروژه‌های در حال اجرا</h2>
                    <ul className="space-y-4">
                        {[
                            { name: "کمک به خانواده‌های نیازمند", raised: 65 },
                            { name: "تجهیز کتابخانه مهدوی", raised: 30 },
                            { name: "برگزاری نشست‌های آخرزمان", raised: 80 },
                        ].map((p) => (
                            <li key={p.name}>
                                <div className="mb-1 flex justify-between text-sm text-gray-700">
                                    <span>{p.name}</span>
                                    <span className="text-primary-700">{p.raised}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-primary-100">
                                    <div
                                        className="h-2 rounded-full bg-primary-600"
                                        style={{ width: `${p.raised}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-xl border border-primary-100 bg-white p-6">
                    <h2 className="mb-3 text-lg font-semibold text-primary-800">حمایت مالی</h2>
                    <p className="mb-4 text-sm leading-7 text-gray-600">
                        می‌توانید مبلغ مورد نظر خود را وارد کرده و به پروژه مورد علاقه‌تان اختصاص دهید.
                    </p>
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="number"
                            placeholder="مبلغ (تومان)"
                            className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                        />
                        <select className="w-full rounded-lg border border-primary-200 px-3 py-2 outline-none focus:border-primary-500">
                            <option>کمک به خانواده‌های نیازمند</option>
                            <option>تجهیز کتابخانه مهدوی</option>
                            <option>برگزاری نشست‌های آخرزمان</option>
                        </select>
                        <button className="w-full rounded-lg bg-primary-700 px-4 py-2.5 font-medium text-white hover:bg-primary-800">
                            پرداخت
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
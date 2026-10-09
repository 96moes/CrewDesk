// src/pages/Register.tsx
import { Link } from "react-router";
import {
    FaTelegramPlane,
    FaPhoneAlt,
    FaUserPlus,
    FaInfoCircle,
} from "react-icons/fa";

const ADMIN_PHONE = import.meta.env.VITE_ADMIN_PHONE || "۰۹۱۲۳۴۵۶۷۸۹";
const ADMIN_TELEGRAM =
    import.meta.env.VITE_TELEGRAM_ADMIN || "your_admin_username";

// Simple hand-off message
const TELEGRAM_TEXT = encodeURIComponent(
    "سلام، من می‌خواهم در «قوم سلمان» ثبت‌نام کنم. لطفاً اطلاعات ورود را برای من ارسال کنید.",
);
const TELEGRAM_URL = `https://t.me/${ADMIN_TELEGRAM}?text=${TELEGRAM_TEXT}`;

export default function Register() {
    return (
        <div className="mx-auto max-w-md py-10">
            <div className="rounded-2xl border border-primary-100 bg-white p-8 shadow-sm">
                {/* Header */}
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <FaUserPlus size={22} />
                    </div>
                    <h1 className="text-2xl font-bold text-primary-800">ثبت‌نام</h1>
                    <p className="mt-2 text-sm leading-7 text-gray-500">
                        برای ایجاد حساب کاربری در «قوم سلمان»، لطفاً با مدیر ما در ارتباط
                        باشید. پس از تأیید، اطلاعات ورود برای شما ارسال می‌شود.
                    </p>
                </div>

                {/* Info box */}
                <div className="mb-6 flex items-start gap-3 rounded-xl bg-primary-50 p-4 text-sm leading-7 text-primary-800">
                    <FaInfoCircle className="mt-1 shrink-0" />
                    <p>
                        برای ثبت‌نام کافی است به شماره یا آیدی تلگرام زیر پیام دهید و درخواست
                        ثبت‌نام خود را ارسال کنید.
                    </p>
                </div>

                {/* Contact options */}
                <div className="space-y-3">
                    {/* Telegram */}
                    <a
                        href={TELEGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-primary-100 bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                                <FaTelegramPlane size={18} />
                            </span>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-800">
                                    پیام در تلگرام
                                </p>
                                <p className="text-xs text-gray-500" dir="ltr">
                                    @{ADMIN_TELEGRAM}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-primary-700">ارسال پیام →</span>
                    </a>

                    {/* Phone */}
                    <a
                        href={`tel:${ADMIN_PHONE}`}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-primary-100 bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                                <FaPhoneAlt size={16} />
                            </span>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-800">
                                    تماس تلفنی
                                </p>
                                <p className="text-xs text-gray-500" dir="ltr">
                                    {ADMIN_PHONE}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-primary-700">تماس →</span>
                    </a>
                </div>

                {/* Footer link */}
                <p className="mt-6 text-center text-sm text-gray-600">
                    قبلاً ثبت‌نام کرده‌اید؟{" "}
                    <Link
                        to="/login"
                        className="font-medium text-primary-700 hover:underline"
                    >
                        ورود
                    </Link>
                </p>
            </div>
        </div>
    );
}
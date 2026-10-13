// src/components/Footer.tsx
import { SocialIcons } from "./SocialIcons";

export default function Footer() {
    return (
        <footer className="mt-8 border-t border-primary-100/80 bg-white/70 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-10 sm:px-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-800 text-xs font-bold text-white">
                            ق‌س
                        </span>
                        <span className="text-sm font-bold text-primary-900">قوم سلمان</span>
                    </div>
                    <p className="text-center text-xs leading-6 text-gray-500">
                        در مسیر زمینه‌سازی ظهور — معارف مهدوی، آموزش و فعالیت‌های فرهنگی
                    </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-medium text-gray-500">
                        ما را در شبکه‌های اجتماعی دنبال کنید
                    </span>
                    <SocialIcons className="justify-center" />
                </div>

                <div className="flex w-full items-center justify-center border-t border-primary-50 pt-5 text-center text-xs text-gray-400">
                    <span>© {new Date().getFullYear()} قوم سلمان — تمامی حقوق محفوظ است.</span>
                </div>
            </div>
        </footer>
    );
}

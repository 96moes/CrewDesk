// src/components/Footer.tsx
import { SocialIcons } from "./SocialIcons";

export default function Footer() {
    return (
        <footer className="border-t border-primary-100 bg-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-8">
                <div className="flex flex-col items-center gap-3">
                    <span className="text-sm font-medium text-primary-800">
                        ما را در شبکه‌های اجتماعی دنبال کنید
                    </span>
                    <SocialIcons className="justify-center" />
                </div>

                <div className="text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} قوم سلمان — تمامی حقوق محفوظ است.
                    <span className="mx-2 text-primary-300">|</span>
                    در مسیر زمینه‌سازی ظهور
                </div>
            </div>
        </footer>
    );
}
// src/pages/NotFound.tsx
import { Link } from "react-router";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <h1 className="text-5xl font-bold text-primary-700">۴۰۴</h1>
            <p className="mt-4 text-gray-600">صفحه‌ای که به دنبال آن بودید پیدا نشد.</p>
            <Link
                to="/"
                className="mt-6 rounded-lg bg-primary-700 px-5 py-2.5 text-white hover:bg-primary-800"
            >
                بازگشت به صفحه اصلی
            </Link>
        </div>
    );
}
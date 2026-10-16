// src/components/Footer.tsx
import { Link, NavLink } from "react-router";
import Container from "./Container";
import { SocialIcons } from "./SocialIcons";
import { PUBLIC_NAV } from "../layouts/publicNav";

/**
 * The public site's footer.
 *
 * Three columns on a desktop, stacked on a phone: who the site is, where else it can be read
 * (the same list the header uses — layouts/publicNav.ts — so the two cannot disagree), and how to
 * follow it. The copyright bar is separated so the layout still reads as a footer when the columns
 * are stacked.
 */
export default function Footer() {
    return (
        <footer className="mt-10 border-t border-primary-100/80 bg-white/70 backdrop-blur">
            <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
                {/* Who */}
                <div>
                    <div className="flex items-center gap-2.5">
                        <span
                            aria-hidden="true"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-sm font-bold text-white"
                        >
                            ق‌س
                        </span>
                        <span className="flex flex-col leading-tight">
                            <span className="text-base font-bold text-primary-900">
                                قوم سلمان
                            </span>
                            <span className="text-[10px] font-medium text-primary-600">
                                در مسیر امام زمان (عج)
                            </span>
                        </span>
                    </div>
                    <p className="mt-3 max-w-xs text-xs leading-6 text-gray-500">
                        در مسیر زمینه‌سازی ظهور — معارف مهدوی، آموزش و فعالیت‌های
                        فرهنگی.
                    </p>
                </div>

                {/* Where else */}
                <nav aria-label="پیوندهای سایت">
                    <h2 className="mb-3 text-sm font-bold text-primary-900">
                        دسترسی سریع
                    </h2>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1">
                        {PUBLIC_NAV.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        [
                                            "text-xs transition-colors",
                                            isActive
                                                ? "font-medium text-primary-800"
                                                : "text-gray-500 hover:text-primary-700",
                                        ].join(" ")
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* How to follow */}
                <div>
                    <h2 className="mb-3 text-sm font-bold text-primary-900">
                        ما را دنبال کنید
                    </h2>
                    <p className="mb-3 text-xs leading-6 text-gray-500">
                        برای دیدن فعالیت‌ها و اطلاع از برنامه‌ها، ما را در شبکه‌های
                        اجتماعی همراهی کنید.
                    </p>
                    <SocialIcons />
                </div>
            </Container>

            <div className="border-t border-primary-50">
                <Container className="flex flex-col items-center justify-between gap-2 py-5 text-center text-xs text-gray-400 sm:flex-row sm:text-right">
                    <span>
                        © {new Date().getFullYear()} قوم سلمان — تمامی حقوق محفوظ
                        است.
                    </span>
                    <Link
                        to="/about"
                        className="transition-colors hover:text-primary-700"
                    >
                        درباره ما
                    </Link>
                </Container>
            </div>
        </footer>
    );
}

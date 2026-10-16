// src/layouts/publicNav.ts
/**
 * The public site's pages, in the order the header shows them.
 *
 * One list with two readers — the top bar (components/Header.tsx) and the footer's quick links
 * (components/Footer.tsx) — so a page cannot appear in one and be missing from the other. The
 * signed-in sections keep their own list next door, in layouts/sectionNav.tsx, because what they
 * show depends on the visitor's role.
 */
export interface PublicNavItem {
    to: string;
    label: string;
    /** Exact match, for the home page. */
    end?: boolean;
}

export const PUBLIC_NAV: PublicNavItem[] = [
    { to: "/", label: "خانه", end: true },
    { to: "/about", label: "معرفی درباره ما" },
    { to: "/gallery", label: "ویدیو و عکس" },
    { to: "/education", label: "آموزش‌ها" },
    { to: "/cooperation", label: "فرصت‌های همکاری" },
    { to: "/donations", label: "کمک‌های مردمی" },
    { to: "/events", label: "رویدادهای برگزار شده" },
];

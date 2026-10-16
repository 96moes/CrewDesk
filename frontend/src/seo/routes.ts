// src/seo/routes.ts

/**
 * Per-route SEO metadata — the single source of truth for the app.
 *
 * Every route listed here is a page a visitor can reach without an account, and each
 * gets a unique title and description. Duplicated titles are one of the most common
 * reasons a site "does not rank": Google has to guess which page is relevant, and
 * usually picks none of them.
 *
 * The signed-in panel (/dashboard and everything under it) is deliberately absent.
 * Those pages are behind a login, so they carry no SEO metadata at all — no title,
 * description, canonical or social tags, only a robots directive keeping them out of
 * search results. src/seo/NoSeo.tsx removes any metadata left behind by the public
 * page the visitor came from, and src/seo/SeoRoute.tsx routes them there.
 *
 * Route inventory here must stay in sync with two other places:
 *   - src/App.tsx            (the actual React Router routes)
 *   - scripts/seo-routes.mjs (used by the sitemap and prerender build steps, and which
 *                             lists the panel paths in PRIVATE_PATHS for exactly the
 *                             reason above)
 *
 * `scripts/check-seo.mjs` fails the build when these drift apart, and when a route in
 * App.tsx is in neither this list nor PRIVATE_PATHS.
 */

export interface RouteSeo {
  /** Route path exactly as declared in App.tsx. */
  path: string;
  /** <title> and og:title. Keep under ~60 characters. */
  title: string;
  /** <meta name="description">. Aim for 120-160 characters. */
  description: string;
  /**
   * Include this route in sitemap.xml.
   *
   * Prerendering is controlled separately by the `prerender` flag in
   * scripts/seo-routes.mjs, because it answers a different question: /login and
   * /register are public and are prerendered, but they are account pages with nothing
   * to rank for, so they stay out of the sitemap.
   */
  index?: boolean;
}
export const ROUTES: RouteSeo[] = [
  {
    path: "/",
    title: "قوم سلمان | معارف مهدوی، دوره‌های آموزشی و فعالیت‌های فرهنگی",
    description:
      "قوم سلمان مجموعه‌ای مردمی برای ترویج معارف مهدوی و آخرزمان است؛ دوره‌های آموزشی، رویدادهای فرهنگی، فرصت‌های همکاری و کمک‌های مردمی.",
    index: true,
  },
  {
    path: "/about",
    title: "درباره ما | قوم سلمان",
    description:
      "با تاریخچه، چشم‌انداز و اهداف قوم سلمان آشنا شوید؛ مجموعه‌ای از منتظران فعال که در مسیر زمینه‌سازی ظهور و خدمت به جامعه فعالیت می‌کنند.",
    index: true,
  },
  {
    path: "/education",
    title: "آموزش‌ها و دوره‌های معارف مهدوی | قوم سلمان",
    description:
      "دوره‌ها و کارگاه‌های تخصصی قوم سلمان در حوزه معارف مهدوی، مهارت‌های تیم‌سازی فرهنگی و تولید محتوای رسانه‌ای، از مقدماتی تا پیشرفته.",
    index: true,
  },
  {
    path: "/gallery",
    title: "گالری عکس و ویدیو | قوم سلمان",
    description:
      "تصاویر و ویدیوهای فعالیت‌ها، رویدادها و برنامه‌های قوم سلمان در یک نگاه.",
    index: true,
  },
  {
    path: "/cooperation",
    title: "فرصت‌های همکاری با قوم سلمان",
    description:
      "راه‌های همراهی با قوم سلمان: مشارکت در تولید محتوا، برگزاری رویداد، آموزش، پشتیبانی فنی و فعالیت‌های داوطلبانه.",
    index: true,
  },
  {
    path: "/donations",
    title: "کمک‌های مردمی و حمایت مالی | قوم سلمان",
    description:
      "با حمایت مالی و معنوی خود از پروژه‌های در حال اجرای قوم سلمان پشتیبانی کنید؛ هر کمک، گامی در جهت زمینه‌سازی ظهور است.",
    index: true,
  },
  {
    path: "/events",
    title: "رویدادهای برگزار شده | قوم سلمان",
    description:
      "مروری بر مهم‌ترین رویدادها، نشست‌ها و برنامه‌های گذشته قوم سلمان.",
    index: true,
  },
  {
    path: "/login",
    title: "ورود به حساب کاربری | قوم سلمان",
    description:
      "ورود اعضا، گروه‌ها و مدیران به حساب کاربری قوم سلمان برای مشاهده پروژه‌ها، وظایف و صف پیام‌های گروهی.",
  },
  {
    path: "/register",
    title: "ثبت‌نام | قوم سلمان",
    description:
      "برای مشارکت در فعالیت‌های قوم سلمان ثبت‌نام کنید. پس از ثبت‌نام، امکان مشاهده پروژه‌ها و وظایف برای شما فعال می‌شود.",
  },
];

/** Routes that belong in sitemap.xml and get prerendered to static HTML. */
export const INDEXABLE_ROUTES: RouteSeo[] = ROUTES.filter((r) => r.index === true);

/** Fallback metadata for any URL that is not listed (the 404 page). */
export const NOT_FOUND_SEO: RouteSeo = {
  path: "/404",
  title: "صفحه یافت نشد | قوم سلمان",
  description:
    "صفحه مورد نظر شما در سایت قوم سلمان یافت نشد. از منوی اصلی می‌توانید به بخش‌های معرفی، آموزش‌ها، رویدادها و کمک‌های مردمی بروید.",
};

/** Looks up metadata for a pathname, tolerating a trailing slash. */
export function seoForPath(pathname: string): RouteSeo | undefined {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return ROUTES.find((r) => r.path === normalized);
}

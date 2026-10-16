// src/components/TopBar.tsx
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { HiMenu, HiX } from "react-icons/hi";
import Container, { type ContainerAlign } from "./Container";

/**
 * The one top bar in the app: the public site's navigation and the signed-in panel's.
 *
 * The two used to be written twice — same chrome, same underline, same hamburger — which is how a
 * breakpoint or a focus style ends up fixed in one place and not the other. Here the bar decides
 * those once, and the caller supplies what is actually different: the brand text, the links, and
 * the account actions on the right.
 *
 * What the bar owns:
 *   - the brand block (mark plus two lines) and where it leads;
 *   - the links: underlined labels from `xl` up, and the hamburger menu below it. One breakpoint for
 *     every section, because both bars carry seven items — the public labels alone need roughly
 *     1400px before they stop wrapping, and the panel's are not much shorter once their icons count,
 *     so anything short of a desktop keeps the menu;
 *   - the menu: it closes on a link, on the brand, on Escape, on a click outside, and on any
 *     navigation at all — that last one falls out of remembering the path the menu was opened at,
 *     rather than syncing the route into state from an effect;
 *   - a skip link, so a keyboard user can jump past the bar and the menu;
 *   - a shadow under the bar once the page has scrolled behind it.
 */
export interface TopBarLink {
    to: string;
    label: string;
    /** Shown before the label in both the bar and the menu. */
    icon?: ReactNode;
    /** Exact match, for an index route like /dashboard. */
    end?: boolean;
}

interface Props {
    /** The brand block: one line of name, one line of context under it. */
    title: string;
    subtitle: string;
    /** Where the brand mark leads. */
    brandTo: string;
    links: TopBarLink[];
    /** Right-hand account actions, shown in the bar from `sm` up. */
    actions?: ReactNode;
    /** The same actions inside the menu, where the bar's are hidden below `sm`. */
    menuActions?: ReactNode;
    /** Accessible name for both navigation landmarks, e.g. the section's title. */
    label: string;
    /** `page` lines the bar up with a centred page; `screen` spans a full-width panel. */
    align?: ContainerAlign;
}

/** Shared by the bar's links and its toggle button. */
const FOCUS_RING =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300";

export default function TopBar({
    title,
    subtitle,
    brandTo,
    links,
    actions,
    menuActions,
    label,
    align = "page",
}: Props) {
    const { pathname } = useLocation();
    const menuId = useId();
    const menuRef = useRef<HTMLDivElement>(null);

    /**
     * The path the menu was opened at, rather than a plain boolean: navigating anywhere makes the
     * two differ, so the menu closes by itself without an effect copying the route into state.
     */
    const [openedAt, setOpenedAt] = useState<string | null>(null);
    const open = openedAt === pathname;

    const close = () => setOpenedAt(null);

    const [scrolled, setScrolled] = useState(
        () => typeof window !== "undefined" && window.scrollY > 4,
    );

    // A shadow, not a border change: the bar should read as floating once content is under it.
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Escape and a click anywhere else close the menu — while it is open, and only then.
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpenedAt(null);
        };
        const onPointerDown = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) setOpenedAt(null);
        };

        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("mousedown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("mousedown", onPointerDown);
        };
    }, [open]);

    return (
        <>
            {/* The first thing a keyboard reaches: past the bar and the menu, into the page. */}
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-800 focus:shadow-[var(--shadow-raised)]"
            >
                پرش به محتوا
            </a>

            <header
                className={[
                    "sticky top-0 z-40 border-b border-primary-100/80 bg-white/75 backdrop-blur-lg",
                    "transition-shadow duration-200 supports-[backdrop-filter]:bg-white/60",
                    scrolled ? "shadow-[var(--shadow-card)]" : "",
                ].join(" ")}
            >
                <div ref={menuRef}>
                    <Container
                        align={align}
                        className="flex items-center justify-between gap-4 py-3"
                    >
                        {/* Brand */}
                        <Link
                            to={brandTo}
                            onClick={close}
                            className={`group flex min-w-0 items-center gap-2.5 rounded-xl ${FOCUS_RING}`}
                            aria-label={title}
                        >
                            <span
                                aria-hidden="true"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform duration-200 group-hover:scale-105"
                            >
                                ق‌س
                            </span>
                            <span className="flex min-w-0 flex-col leading-tight">
                                <span className="truncate text-base font-bold tracking-tight text-primary-900 sm:text-lg">
                                    {title}
                                </span>
                                <span className="truncate text-[10px] font-medium text-primary-600">
                                    {subtitle}
                                </span>
                            </span>
                        </Link>

                        {/* The links, from xl up */}
                        <nav
                            className="hidden items-center gap-0.5 xl:flex"
                            aria-label={label}
                        >
                            {links.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.end}
                                    className={desktopLinkClass}
                                >
                                    {link.icon && (
                                        <span aria-hidden="true">{link.icon}</span>
                                    )}
                                    <span>{link.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        <div className="flex items-center gap-2">
                            <div className="hidden items-center gap-2 sm:flex">
                                {actions}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setOpenedAt(open ? null : pathname)
                                }
                                className={`rounded-xl p-2 text-primary-700 transition-colors hover:bg-primary-50 xl:hidden ${FOCUS_RING}`}
                                aria-label={open ? "بستن منو" : "باز کردن منو"}
                                aria-expanded={open}
                                aria-controls={menuId}
                            >
                                {open ? <HiX size={22} /> : <HiMenu size={22} />}
                            </button>
                        </div>
                    </Container>

                    {/* The same links, plus the actions the bar hides on a narrow screen. */}
                    {open && (
                        <nav
                            id={menuId}
                            aria-label={label}
                            className="animate-rise border-t border-primary-100 bg-white/95 backdrop-blur xl:hidden"
                        >
                            <Container align={align} className="py-3">
                                <div className="flex flex-col gap-1">
                                    {links.map((link) => (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            end={link.end}
                                            onClick={close}
                                            className={mobileLinkClass}
                                        >
                                            {link.icon && (
                                                <span aria-hidden="true">
                                                    {link.icon}
                                                </span>
                                            )}
                                            <span>{link.label}</span>
                                        </NavLink>
                                    ))}
                                </div>

                                {menuActions && (
                                    <div className="mt-3 flex flex-col gap-1 border-t border-gray-100 pt-3 sm:hidden">
                                        {menuActions}
                                    </div>
                                )}
                            </Container>
                        </nav>
                    )}
                </div>
            </header>
        </>
    );
}

/**
 * An underline under the label marks the current page. A filled pill per item would turn the bar
 * into a row of buttons and bury the brand; with seven links, a short bar under the label reads as
 * "you are here" without adding weight.
 */
const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
        "relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
        `transition-colors duration-200 ${FOCUS_RING}`,
        "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full",
        "after:transition-transform after:duration-200 after:origin-center",
        isActive
            ? "text-primary-800 after:scale-x-100 after:bg-primary-600"
            : "text-gray-600 after:scale-x-0 after:bg-primary-400 hover:text-primary-700 hover:after:scale-x-100",
    ].join(" ");

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
        "flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
        FOCUS_RING,
        isActive
            ? "bg-primary-100 text-primary-800"
            : "text-gray-700 hover:bg-primary-50 hover:text-primary-700",
    ].join(" ");

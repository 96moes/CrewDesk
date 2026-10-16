// src/components/SocialIcons.tsx
import { useEffect, type ReactNode } from "react";
import {
    FaInstagram,
    FaTelegramPlane,
    FaYoutube,
    FaLink,
} from "react-icons/fa";
import { SiAparat } from "react-icons/si";
import type { SocialLink } from "../types/socialLink";
import { useSocialLinkStore } from "../stores/socialLinkStore";

/* ---------- Custom brand icons ---------- */
function BaleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-6v4h3l-4 6z" />
        </svg>
    );
}
function EitaIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2 5h6v2h-6V7zm0 4h4v2h-4v-2zm0 4h6v2h-6v-2z" />
        </svg>
    );
}
function RubikaIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.2 14.2l-1.4 1.4L12 15l-2.8 2.6-1.4-1.4L10.4 14 7.8 11.4l1.4-1.4L12 12.6l2.8-2.6 1.4 1.4-2.6 2.6 2.6 2.2z" />
        </svg>
    );
}

interface IconConfig {
    icon: ReactNode;
    label: string;
    hover: string;
}

const PLATFORM_CONFIG: Record<string, IconConfig> = {
    instagram: { icon: <FaInstagram />, label: "اینستاگرام", hover: "hover:text-primary-700" },
    telegram: { icon: <FaTelegramPlane />, label: "تلگرام", hover: "hover:text-primary-700" },
    youtube: { icon: <FaYoutube />, label: "یوتیوب", hover: "hover:text-primary-700" },
    aparat: { icon: <SiAparat />, label: "آپارات", hover: "hover:text-primary-700" },
    bale: { icon: <BaleIcon />, label: "بله", hover: "hover:text-primary-700" },
    eita: { icon: <EitaIcon />, label: "ایتا", hover: "hover:text-primary-700" },
    rubika: { icon: <RubikaIcon />, label: "روبیکا", hover: "hover:text-primary-700" },
    adminEita: { icon: <EitaIcon />, label: "ایتا ادمین", hover: "hover:text-primary-700" },
    adminBale: { icon: <BaleIcon />, label: "بله ادمین", hover: "hover:text-primary-700" },
};

export function SocialItem({ link }: { link: SocialLink }) {
    const cfg = PLATFORM_CONFIG[link.platform];
    const icon = cfg?.icon ?? <FaLink />;
    const label = cfg?.label ?? link.platform;
    const hover = cfg?.hover ?? "hover:text-primary-700";

    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={`text-2xl text-gray-500 transition-colors ${hover}`}
        >
            {icon}
        </a>
    );
}

export function SocialIcons({
    className = "",
    includeAdmin = false,
}: {
    className?: string;
    includeAdmin?: boolean;
}) {
    const links = useSocialLinkStore((s) => s.links);
    const loading = useSocialLinkStore((s) => s.loading);
    const error = useSocialLinkStore((s) => s.error);
    const fetchLinks = useSocialLinkStore((s) => s.fetchLinks);

    // ✅ Self-fetch: runs once, guarded by the store's `fetched` flag
    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const visible = includeAdmin
        ? links
        : links.filter((l) => !l.platform.startsWith("admin"));

    // Loading skeleton
    if (loading && visible.length === 0) {
        return (
            <div className={`flex gap-3 ${className}`}>
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-6 animate-pulse rounded-full bg-primary-100" />
                ))}
            </div>
        );
    }

    // Error — show message in dev only
    if (error && visible.length === 0) {
        return (
            <div className={`text-xs text-error-500 ${className}`}>
                خطا در بارگذاری شبکه‌های اجتماعی: {error}
            </div>
        );
    }

    // Empty but no error — this is the "invisible" case you're hitting
    if (visible.length === 0) {
        return (
            <div className={`text-xs text-gray-400 ${className}`}>
                (شبکه اجتماعی ثبت نشده)
            </div>
        );
    }

    return (
        <div className={`flex flex-wrap items-center gap-4 ${className}`}>
            {visible.map((link) => (
                <SocialItem key={link.id} link={link} />
            ))}
        </div>
    );
}
// src/components/Container.tsx
import type { ReactNode } from "react";

/**
 * The one horizontal rhythm in the app.
 *
 * Every full-width row — the top bar, the page's content, the footer — goes through this, so they
 * line up to the pixel and cannot drift apart when one of them is edited. It decides width and
 * padding, nothing else: pages keep their own grids inside it.
 *
 *   page    the public site's centred column, max-w-6xl
 *   screen  a full-width viewport row, for the panel's tables
 */
export type ContainerAlign = "page" | "screen";

interface Props {
    align?: ContainerAlign;
    className?: string;
    children: ReactNode;
}

export default function Container({
    align = "page",
    className,
    children,
}: Props) {
    return (
        <div
            className={[
                align === "page" ? "mx-auto w-full max-w-6xl" : "w-full",
                "px-4 sm:px-6",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    );
}

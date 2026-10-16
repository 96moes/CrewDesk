// src/components/ScrollToTop.tsx
import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Starts every page at the top.
 *
 * The app is one document, so without this a visitor who follows a link from halfway down a long
 * page — the gallery, the events list — lands halfway down the next one. It is rendered once, in
 * src/App.tsx, so the public pages and both signed-in sections get it from the same place.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

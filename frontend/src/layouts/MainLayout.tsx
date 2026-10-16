// src/layouts/MainLayout.tsx
import { Outlet } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "../components/Container";

/**
 * The public site's layout: the top bar, the page, the footer.
 *
 * A flex column, so the footer sits at the bottom of a short page instead of floating in the middle
 * of the screen. `<main id="main">` is what the bar's skip link jumps to, which is why it carries
 * `tabIndex={-1}`: it can take focus without joining the tab order.
 *
 * Content sits directly on the page wash defined in index.css — pages supply their own surface
 * treatment (cards, panels) — and is centred by components/Container.tsx, the same rule the bar and
 * the footer use, so all three line up.
 */
export default function MainLayout() {
    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
            <Header />

            <main
                id="main"
                tabIndex={-1}
                className="flex-1 py-8 outline-none sm:py-10"
            >
                <Container>
                    <Outlet />
                </Container>
            </main>

            <Footer />
        </div>
    );
}

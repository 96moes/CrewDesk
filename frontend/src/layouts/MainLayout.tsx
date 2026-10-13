// src/layouts/MainLayout.tsx
import { Outlet } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MainLayout() {
    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
            <Header />
            {/*
                Content sits directly on the page wash defined in index.css. Pages supply
                their own surface treatment (cards, panels), so the layout stays a plain
                container rather than adding another layer of background.
            */}
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

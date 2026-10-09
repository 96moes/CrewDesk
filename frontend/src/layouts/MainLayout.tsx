// src/layouts/MainLayout.tsx
import { Outlet } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MainLayout() {
    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
            <Header />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
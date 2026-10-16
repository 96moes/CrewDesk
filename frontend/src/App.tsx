// src/App.tsx
import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route } from "react-router";

// Layouts and guards are needed by every route, so they stay in the main bundle.
import MainLayout from "./layouts/MainLayout";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ManagementRoute from "./components/ManagementRoute";
import ScrollToTop from "./components/ScrollToTop";
import SeoRoute from "./seo/SeoRoute";

/*
 * Pages are code-split: a visitor of the public site never downloads the
 * management panel, and each section arrives only when it is opened.
 */
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Education = lazy(() => import("./pages/Education"));
const Cooperation = lazy(() => import("./pages/Cooperation"));
const Donations = lazy(() => import("./pages/Donations"));
const Events = lazy(() => import("./pages/Events"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));

const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const GroupsManage = lazy(() => import("./pages/GroupsManage"));

const Overview = lazy(() => import("./pages/admin/Overview"));
const UsersManage = lazy(() => import("./pages/admin/UsersManage"));
const ProjectsManage = lazy(() => import("./pages/admin/ProjectsManage"));
const TasksManage = lazy(() => import("./pages/admin/TasksManage"));
const BulkMessages = lazy(() => import("./pages/admin/BulkMessages"));
const MediaManage = lazy(() => import("./pages/admin/MediaManage"));
const OpportunitiesManage = lazy(
  () => import("./pages/admin/OpportunitiesManage"),
);

/** Placeholder shown while a page chunk is in flight. */
function PageFallback() {
  return <div className="page-loading" role="status" aria-live="polite" />;
}

/**
 * Wraps a page in its own Suspense boundary. A route element renders inside its
 * layout's <Outlet />, so the boundary — not the layout — is what gets replaced
 * while a chunk loads: the header, footer and panel navigation stay on screen
 * instead of flashing away on every navigation.
 */
const page = (node: ReactNode) => (
  <Suspense fallback={<PageFallback />}>{node}</Suspense>
);

export default function App() {
  return (
    <>
      {/* Route-level <title>, description, canonical and robots tags. */}
      <SeoRoute />

      {/* Every navigation starts at the top, in all three sections. */}
      <ScrollToTop />

      <Routes>
        {/*
          1. Public site — everything anyone can open without an account.
        */}
        <Route element={<MainLayout />}>
          <Route path="/" element={page(<Home />)} />
          <Route path="/about" element={page(<About />)} />
          <Route path="/gallery" element={page(<Gallery />)} />
          <Route path="/education" element={page(<Education />)} />
          <Route path="/cooperation" element={page(<Cooperation />)} />
          <Route path="/donations" element={page(<Donations />)} />
          <Route path="/events" element={page(<Events />)} />
          <Route path="/login" element={page(<Login />)} />
          <Route path="/register" element={page(<Register />)} />

          <Route path="*" element={page(<NotFound />)} />
        </Route>

        {/*
          The two signed-in sections are deliberately OUTSIDE MainLayout, because the
          public header and footer are site navigation: inside a signed-in area they
          compete with the panel navigation, wrap the tables in a max-width column,
          and offer links back out to the public site. Each section has its own
          layout; both render the same frame (components/PanelShell.tsx) with their
          own navigation.
        */}
        <Route element={<ProtectedRoute />}>
          {/*
            2. Signed-in user area — open to any account holder, whatever their role.
            An administrator or manager gets the panel links appended to the
            navigation here; no one else ever sees them (layouts/sectionNav.tsx).
          */}
          <Route element={<UserLayout />}>
            <Route path="/dashboard/user" element={page(<UserDashboard />)} />
            {/* Group managers run their own groups; no role restriction, because the
                backend grants the group endpoints to any signed-in user. */}
            <Route path="/dashboard/groups" element={page(<GroupsManage />)} />
          </Route>

          {/*
            3. Management panel. The section is not wrapped in a guard as a whole —
            the guards are applied per page, so someone without the role for a page
            is redirected to /dashboard/groups rather than being bounced out of the
            panel entirely.
          */}
          <Route path="/dashboard" element={<AdminLayout />}>
            {/* Content pages: administrators and managers alike. */}
            <Route element={<ManagementRoute />}>
              <Route index element={page(<Overview />)} />
              <Route path="projects" element={page(<ProjectsManage />)} />
              <Route path="tasks" element={page(<TasksManage />)} />
              <Route path="bulk-messages" element={page(<BulkMessages />)} />
              <Route path="gallery" element={page(<MediaManage />)} />
              <Route path="opportunities" element={page(<OpportunitiesManage />)} />
            </Route>

            {/* User accounts: administrators only — the one page a manager may not open. */}
            <Route element={<AdminRoute />}>
              <Route path="users" element={page(<UsersManage />)} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}
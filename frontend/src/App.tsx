// src/App.tsx
import { Routes, Route } from "react-router";
import MainLayout from "./layouts/MainLayout";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ManagementRoute from "./components/ManagementRoute";
import SeoRoute from "./seo/SeoRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import Education from "./pages/Education";
import Cooperation from "./pages/Cooperation";
import Donations from "./pages/Donations";
import Events from "./pages/Events";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";

import Overview from "./pages/admin/Overview";
import UsersManage from "./pages/admin/UsersManage";
import ProjectsManage from "./pages/admin/ProjectsManage";
import TasksManage from "./pages/admin/TasksManage";
import BulkMessages from "./pages/admin/BulkMessages";
import MediaManage from "./pages/admin/MediaManage";
import GroupsManage from "./pages/GroupsManage";

export default function App() {
  return (
    <>
      {/* Route-level <title>, description, canonical and robots tags. */}
      <SeoRoute />

      <Routes>
        {/*
          1. Public site — everything anyone can open without an account.
        */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/education" element={<Education />} />
          <Route path="/cooperation" element={<Cooperation />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/events" element={<Events />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="*" element={<NotFound />} />
        </Route>

        {/*
          The two signed-in sections are deliberately OUTSIDE MainLayout, because the public
          header and footer are site navigation: inside a signed-in area they compete with the
          panel navigation, wrap the tables in a max-width column, and offer links back out to
          the public site. Each section has its own layout; both render the same frame
          (components/PanelShell.tsx) with their own navigation.
        */}
        <Route element={<ProtectedRoute />}>
          {/*
            2. Signed-in user area — open to any account holder, whatever their role.
            An administrator or manager gets the panel links appended to the navigation here;
            no one else ever sees them (layouts/sectionNav.tsx).
          */}
          <Route element={<UserLayout />}>
            <Route path="/dashboard/user" element={<UserDashboard />} />
            {/* Group managers run their own groups; no role restriction, because the
                backend grants the group endpoints to any signed-in user. */}
            <Route path="/dashboard/groups" element={<GroupsManage />} />
          </Route>

          {/*
            3. Management panel. The section is not wrapped in a guard as a whole — the guards
            are applied per page, so someone without the role for a page is redirected to
            /dashboard/groups rather than being bounced out of the panel entirely.
          */}
          <Route path="/dashboard" element={<AdminLayout />}>
            {/* Content pages: administrators and managers alike. */}
            <Route element={<ManagementRoute />}>
              <Route index element={<Overview />} />
              <Route path="projects" element={<ProjectsManage />} />
              <Route path="tasks" element={<TasksManage />} />
              <Route path="bulk-messages" element={<BulkMessages />} />
              <Route path="gallery" element={<MediaManage />} />
            </Route>

            {/* User accounts: administrators only — the one page a manager may not open. */}
            <Route element={<AdminRoute />}>
              <Route path="users" element={<UsersManage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}

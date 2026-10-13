// src/App.tsx
import { Routes, Route } from "react-router";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
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

import AdminLayout from "./pages/admin/AdminLayout";
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
          Public site.
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
          Signed-in panel — deliberately OUTSIDE MainLayout, and shared by two routes so the frame
          is identical for both (PanelShell renders it):

            /dashboard/user   the generic user dashboard
            /dashboard/*      the panel, incl. group management for group leaders

          The public header and footer are site navigation; inside a signed-in area they compete
          with the panel nav, wrap the tables in a max-width column, and offer links back into the
          public site. PanelShell carries its own "view site" link instead.

          The panel is NOT wrapped in AdminRoute as a whole. Group management lives here too, but
          the backend grants group endpoints to any signed-in user — only the bulk-message queue
          is ADMIN (see backend/src/groups/groups.controller.ts). So the parent guard is
          ProtectedRoute and AdminRoute is applied per admin-only page.
        */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/user" element={<UserDashboard />} />

          <Route path="/dashboard" element={<AdminLayout />}>
            {/* Admin-only pages */}
            <Route element={<AdminRoute />}>
              <Route index element={<Overview />} />
              <Route path="users" element={<UsersManage />} />
              <Route path="projects" element={<ProjectsManage />} />
              <Route path="tasks" element={<TasksManage />} />
              <Route path="bulk-messages" element={<BulkMessages />} />
              <Route path="gallery" element={<MediaManage />} />
            </Route>

            {/* Group leaders manage their own groups; no role restriction */}
            <Route path="groups" element={<GroupsManage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

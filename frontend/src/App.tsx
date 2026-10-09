// src/App.tsx
import { Routes, Route } from "react-router";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

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
import GroupsManage from "./pages/GroupsManage";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/education" element={<Education />} />
        <Route path="/cooperation" element={<Cooperation />} />
        <Route path="/donations" element={<Donations />} />
        <Route path="/events" element={<Events />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Any logged-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/user" element={<UserDashboard />} />
          <Route path="/groups" element={<GroupsManage />} />
        </Route>

        {/* Admin only — nested under AdminLayout */}
        <Route element={<AdminRoute />}>
          <Route path="/dashboard" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="users" element={<UsersManage />} />
            <Route path="projects" element={<ProjectsManage />} />
            <Route path="tasks" element={<TasksManage />} />
            <Route path="bulk-messages" element={<BulkMessages />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
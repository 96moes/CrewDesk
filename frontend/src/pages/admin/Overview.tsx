// src/pages/admin/Overview.tsx
import { useEffect } from "react";
import { Link } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { useUsersAdminStore } from "../../stores/usersAdminStore";
import { useProjectsStore } from "../../stores/projectsStore";
import { useTasksStore } from "../../stores/tasksStore";
import { canManageUsers } from "../../lib/roles";
import {
    FaUsers,
    FaProjectDiagram,
    FaTasks,
    FaCheckCircle,
} from "react-icons/fa";

/**
 * The panel overview.
 *
 * The account count and its link are administrator-only, like the page behind them: a manager
 * neither sees the card nor requests the user list, which the API would refuse. The remaining
 * cards are the same for both roles.
 */
export default function Overview() {
    const role = useAuthStore((s) => s.role);
    const canSeeUsers = canManageUsers(role);

    const users = useUsersAdminStore((s) => s.users);
    const usersLoaded = useUsersAdminStore((s) => s.loaded);
    const fetchUsers = useUsersAdminStore((s) => s.fetch);

    const projects = useProjectsStore((s) => s.projects);
    const projectsLoaded = useProjectsStore((s) => s.loaded);
    const fetchProjects = useProjectsStore((s) => s.fetch);

    const tasks = useTasksStore((s) => s.tasks);
    const tasksLoaded = useTasksStore((s) => s.loaded);
    const fetchTasks = useTasksStore((s) => s.fetch);

    useEffect(() => {
        if (canSeeUsers && !usersLoaded) fetchUsers();
        if (!projectsLoaded) fetchProjects();
        if (!tasksLoaded) fetchTasks();
    }, [
        canSeeUsers,
        usersLoaded,
        projectsLoaded,
        tasksLoaded,
        fetchUsers,
        fetchProjects,
        fetchTasks,
    ]);

    const doneTasks = tasks.filter((t) => t.status === "done").length;

    const cards = [
        ...(canSeeUsers
            ? [
                  {
                      label: "کاربران",
                      value: users.length,
                      to: "/dashboard/users",
                      icon: <FaUsers />,
                  },
              ]
            : []),
        {
            label: "پروژه‌ها",
            value: projects.length,
            to: "/dashboard/projects",
            icon: <FaProjectDiagram />,
        },
        {
            label: "وظایف",
            value: tasks.length,
            to: "/dashboard/tasks",
            icon: <FaTasks />,
        },
        {
            label: "وظایف انجام‌شده",
            value: doneTasks,
            to: "/dashboard/tasks",
            icon: <FaCheckCircle />,
        },
    ];

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold text-primary-800">نمای کلی</h1>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((c) => (
                    <Link
                        key={c.label}
                        to={c.to}
                        className="rounded-xl border border-primary-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                    >
                        <div className="mb-2 flex items-center gap-2 text-primary-700">
                            {c.icon}
                            <span className="text-sm text-gray-500">{c.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-primary-800">{c.value}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
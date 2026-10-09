// src/stores/projectsStore.ts
import { create } from "zustand";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  type Project,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from "../api/projects";

interface State {
  projects: Project[];
  loading: boolean;
  error: string | null;
  loaded: boolean;

  fetch: () => Promise<void>;
  add: (p: CreateProjectPayload) => Promise<void>;
  edit: (id: string, p: UpdateProjectPayload) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useProjectsStore = create<State>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  loaded: false,

  fetch: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const projects = await listProjects();
      set({ projects, loading: false, loaded: true });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "خطا در بارگذاری پروژه‌ها",
        loading: false,
      });
    }
  },

  add: async (payload) => {
    const created = await createProject(payload);
    set({ projects: [created, ...get().projects] });
  },

  edit: async (id, payload) => {
    const updated = await updateProject(id, payload);
    set({ projects: get().projects.map((p) => (p.id === id ? updated : p)) });
  },

  remove: async (id) => {
    await deleteProject(id);
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },
}));

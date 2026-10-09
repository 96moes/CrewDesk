// src/stores/tasksStore.ts
import { create } from "zustand";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  type Task,
  type CreateTaskPayload,
  type UpdateTaskPayload,
} from "../api/tasks";

interface State {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  loaded: boolean;

  fetch: () => Promise<void>;
  add: (t: CreateTaskPayload) => Promise<void>;
  edit: (id: string, t: UpdateTaskPayload) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTasksStore = create<State>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  loaded: false,

  fetch: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const tasks = await listTasks();
      set({ tasks, loading: false, loaded: true });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "خطا در بارگذاری وظایف",
        loading: false,
      });
    }
  },

  add: async (payload) => {
    const created = await createTask(payload);
    set({ tasks: [created, ...get().tasks] });
  },

  edit: async (id, payload) => {
    const updated = await updateTask(id, payload);
    set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
  },

  remove: async (id) => {
    await deleteTask(id);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },
}));

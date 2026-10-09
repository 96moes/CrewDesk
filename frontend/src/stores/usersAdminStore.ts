// src/stores/usersAdminStore.ts
import { create } from "zustand";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  type AdminUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "../api/users";

interface State {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  loaded: boolean;

  fetch: () => Promise<void>;
  add: (p: CreateUserPayload) => Promise<void>;
  edit: (id: string, p: UpdateUserPayload) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useUsersAdminStore = create<State>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  loaded: false,

  fetch: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const users = await listUsers();
      set({ users, loading: false, loaded: true });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "خطا در بارگذاری کاربران",
        loading: false,
      });
    }
  },

  add: async (payload) => {
    const created = await createUser(payload);
    set({ users: [...get().users, created] });
  },

  edit: async (id, payload) => {
    const updated = await updateUser(id, payload);
    set({ users: get().users.map((u) => (u.id === id ? updated : u)) });
  },

  remove: async (id) => {
    await deleteUser(id);
    set({ users: get().users.filter((u) => u.id !== id) });
  },
}));
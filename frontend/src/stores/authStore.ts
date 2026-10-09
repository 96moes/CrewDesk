// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  login as loginApi,
  getMe,
  type CurrentUser,
  type UserRole,
} from "../api/auth";

interface AuthState {
  token: string | null;
  role: UserRole | null;
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      user: null,
      loading: false,
      error: null,

      login: async (username, password) => {
        set({ loading: true, error: null });
        try {
          const res = await loginApi({ username, password });
          set({ token: res.access_token, role: res.role });
          // fetch full profile right after login
          await get().fetchMe();
          set({ loading: false });
        } catch (err: any) {
          set({
            error:
              err?.response?.data?.message ??
              "نام کاربری یا رمز عبور اشتباه است",
            loading: false,
          });
          throw err;
        }
      },

      fetchMe: async () => {
        try {
          const user = await getMe();
          set({ user, role: user.role });
        } catch (err) {
          // token invalid → wipe
          set({ token: null, user: null, role: null });
          throw err;
        }
      },

      logout: () => {
        set({ token: null, user: null, role: null, error: null });
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({ token: s.token, role: s.role, user: s.user }),
    },
  ),
);

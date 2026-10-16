// src/stores/userDirectoryStore.ts
import { create } from "zustand";
import {
  listUserDirectory,
  type UserDirectoryEntry,
} from "../api/users";

/**
 * The id/username list behind the project-manager and task-assignee pickers.
 *
 * Kept apart from usersAdminStore because the two answer to different roles: this one is open to
 * every management role, while that one holds the full account records only an administrator may
 * read. Its narrow shape is deliberate — see UserDirectoryEntry in src/api/users.ts.
 */
interface State {
  entries: UserDirectoryEntry[];
  loading: boolean;
  loaded: boolean;

  fetch: () => Promise<void>;
}

export const useUserDirectoryStore = create<State>((set, get) => ({
  entries: [],
  loading: false,
  loaded: false,

  fetch: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    try {
      const entries = await listUserDirectory();
      set({ entries, loading: false, loaded: true });
    } catch {
      // A picker that fails to load must not take the page down with it: the list stays empty,
      // the rest of the form still works, and the next visit tries again.
      set({ loading: false });
    }
  },
}));

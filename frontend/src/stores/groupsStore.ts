// src/stores/groupsStore.ts
import { create } from "zustand";
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  getMyGroups,
  leaveGroup,
  removeGroupMember,
  renameGroup,
  submitGroupMessage,
  transferGroup,
  type AddGroupMemberPayload,
  type ManagedGroup,
} from "../api/groups";

/**
 * The groups the signed-in user can open, and every change to them.
 *
 * Mutations throw instead of parking their message in `error`: a failure belongs next to the button
 * that caused it, while `error` is for the one thing the whole page shares — loading the list.
 * Every mutation answers with the updated group, so the list is rebuilt from the response and the
 * page never has to guess what the server did.
 */
interface State {
  groups: ManagedGroup[];
  loading: boolean;
  loaded: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  add: (name: string) => Promise<void>;
  rename: (groupId: string, name: string) => Promise<void>;
  remove: (groupId: string) => Promise<void>;
  leave: (groupId: string) => Promise<void>;
  transfer: (groupId: string, userId: string) => Promise<void>;
  addMember: (groupId: string, payload: AddGroupMemberPayload) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  submitMessage: (
    groupId: string,
    content: string,
  ) => Promise<{ recipientCount: number }>;
}

const replace = (groups: ManagedGroup[], updated: ManagedGroup) =>
  groups.map((group) => (group.id === updated.id ? updated : group));

export const useGroupsStore = create<State>((set, get) => ({
  groups: [],
  loading: false,
  loaded: false,
  error: null,

  fetch: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const groups = await getMyGroups();
      set({ groups, loading: false, loaded: true });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "خطا در بارگذاری گروه‌ها",
        loading: false,
      });
    }
  },

  add: async (name) => {
    const created = await createGroup(name);
    set({ groups: [created, ...get().groups] });
  },

  rename: async (groupId, name) => {
    const updated = await renameGroup(groupId, name);
    set({ groups: replace(get().groups, updated) });
  },

  remove: async (groupId) => {
    await deleteGroup(groupId);
    set({ groups: get().groups.filter((group) => group.id !== groupId) });
  },

  leave: async (groupId) => {
    await leaveGroup(groupId);
    set({ groups: get().groups.filter((group) => group.id !== groupId) });
  },

  transfer: async (groupId, userId) => {
    // The response is the group as the caller now sees it: no longer theirs to manage.
    const updated = await transferGroup(groupId, userId);
    set({ groups: replace(get().groups, updated) });
  },

  addMember: async (groupId, payload) => {
    const updated = await addGroupMember(groupId, payload);
    set({ groups: replace(get().groups, updated) });
  },

  removeMember: async (groupId, userId) => {
    const updated = await removeGroupMember(groupId, userId);
    set({ groups: replace(get().groups, updated) });
  },

  // The only change that leaves the group as it is: the request goes to the delivery queue, which
  // the group page does not show.
  submitMessage: (groupId, content) => submitGroupMessage(groupId, content),
}));

// src/stores/socialLinkStore.ts
import { create } from "zustand";
import { getSocialLink } from "../api/routes";
import type { SocialLink } from "../types/socialLink";

interface SocialLinkState {
  links: SocialLink[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  fetchLinks: () => Promise<void>;
  getByPlatform: (platform: string) => SocialLink | undefined;
}

export const useSocialLinkStore = create<SocialLinkState>((set, get) => ({
  links: [],
  loading: false,
  error: null,
  fetched: false,

  fetchLinks: async () => {
    // ✅ Only fetch once (or if a previous attempt is in-flight)
    if (get().fetched || get().loading) return;

    set({ loading: true, error: null });
    try {
      const res = await getSocialLink();
      set({
        links: res?.data ?? [],
        loading: false,
        fetched: true,
      });
    } catch (err: any) {
      set({
        error: err?.message ?? "Failed to load social links",
        loading: false,
        fetched: true, // prevents infinite retry loops; reset manually if needed
      });
    }
  },

  getByPlatform: (platform) => get().links.find((l) => l.platform === platform),
}));

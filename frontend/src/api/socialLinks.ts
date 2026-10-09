// src/api/socialLinks.ts
import { publicApi } from "./axios";
import type { SocialLinksResponse } from "../types/socialLink";

export async function getSocialLink(): Promise<SocialLinksResponse> {
  const { data } = await publicApi.get<SocialLinksResponse>("/social-links");
  return data;
}

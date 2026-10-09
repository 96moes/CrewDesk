// src/types/socialLink.ts
export type SocialPlatform =
  | "instagram"
  | "telegram"
  | "bale"
  | "eita"
  | "youtube"
  | "rubika"
  | "aparat"
  | "adminEita"
  | "adminBale";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}

export interface SocialLinksResponse {
  success: boolean;
  data: SocialLink[];
}

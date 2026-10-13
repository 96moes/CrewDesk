// src/api/media.ts
import { api, publicApi } from "./axios";

export type MediaKind = "photo" | "video";

/** A gallery item as returned by the API. */
export interface MediaItem {
  id: string;
  title: string;
  kind: MediaKind;
  /** The original URL an admin supplied. */
  url: string;
  /**
   * Normalised player URL, derived server-side for videos. Null for photos, and for a
   * video whose host the API does not recognise.
   */
  embedUrl: string | null;
  thumbnailUrl: string | null;
  description: string | null;
  /** When set, the item links out instead of rendering inline. */
  linkUrl: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMediaPayload {
  title: string;
  kind: MediaKind;
  url: string;
  description?: string;
  thumbnailUrl?: string | null;
  linkUrl?: string | null;
  sortOrder?: number;
  published?: boolean;
}

export type UpdateMediaPayload = Partial<CreateMediaPayload>;

/** Public gallery feed. No authentication required. */
export async function listMedia(): Promise<MediaItem[]> {
  const { data } = await publicApi.get<MediaItem[]>("/media");
  return data;
}

/** Admin listing, including unpublished items. */
export async function listAllMedia(): Promise<MediaItem[]> {
  const { data } = await api.get<MediaItem[]>("/media/admin/all");
  return data;
}

export async function createMedia(payload: CreateMediaPayload): Promise<MediaItem> {
  const { data } = await api.post<MediaItem>("/media", payload);
  return data;
}

export async function updateMedia(
  id: string,
  payload: UpdateMediaPayload,
): Promise<MediaItem> {
  const { data } = await api.patch<MediaItem>(`/media/${id}`, payload);
  return data;
}

export async function deleteMedia(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/media/${id}`);
  return data;
}

/** True when the item should open an external page rather than render inline. */
export function isExternal(item: MediaItem): boolean {
  return Boolean(item.linkUrl);
}

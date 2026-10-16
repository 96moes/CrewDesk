// src/api/opportunities.ts
import { api, publicApi } from "./axios";

/** A cooperation opportunity as returned by the API. */
export interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  /** Call-to-action button text. Null means the page's own default is used. */
  actionLabel: string | null;
  /** Where the button points. Null means the page's fallback destination is used. */
  actionUrl: string | null;
  /** Lower sorts first. */
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOpportunityPayload {
  title: string;
  description?: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  sortOrder?: number;
  published?: boolean;
}

export type UpdateOpportunityPayload = Partial<CreateOpportunityPayload>;

/** Public feed for the «فرصت‌های همکاری» page. No authentication required. */
export async function listOpportunities(): Promise<Opportunity[]> {
  const { data } = await publicApi.get<Opportunity[]>("/opportunities");
  return data;
}

/** Admin listing, including unpublished items. */
export async function listAllOpportunities(): Promise<Opportunity[]> {
  const { data } = await api.get<Opportunity[]>("/opportunities/admin/all");
  return data;
}

export async function createOpportunity(
  payload: CreateOpportunityPayload,
): Promise<Opportunity> {
  const { data } = await api.post<Opportunity>("/opportunities", payload);
  return data;
}

export async function updateOpportunity(
  id: string,
  payload: UpdateOpportunityPayload,
): Promise<Opportunity> {
  const { data } = await api.patch<Opportunity>(`/opportunities/${id}`, payload);
  return data;
}

export async function deleteOpportunity(
  id: string,
): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/opportunities/${id}`);
  return data;
}

/** The label a card's button shows when the opportunity does not set one. */
export const DEFAULT_ACTION_LABEL = "درخواست همکاری";

/** True when the action URL leaves the site and should open in a new tab. */
export function isExternalAction(url: string | null | undefined): boolean {
  return /^https?:\/\//i.test(url ?? "");
}

// src/api/users.ts
import { api } from "./axios";
import type { UserRole } from "./auth";
export type { UserRole } from "./auth";

export interface AdminUser {
  id: string;
  username: string;
  role: UserRole;
  fullName?: string | null;
  phone?: string | null;
  /** Ids of the groups this user belongs to. */
  groupIds: string[];
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  role?: UserRole;
  /**
   * null clears the field. An empty string would do something else entirely: `phone` is unique,
   * so a second account with "" would collide, whereas two NULLs are perfectly legal.
   */
  fullName?: string | null;
  phone?: string | null;
}

// ---------- Self ----------
export interface ProfileResponse {
  id: string;
  username: string;
  role: UserRole;
  fullName?: string | null;
  phone?: string | null;
  /** Ids of the groups this user belongs to. */
  groupIds: string[];
}

export async function getMyProfile(): Promise<ProfileResponse> {
  const { data } = await api.get<ProfileResponse>("/users/me/profile");
  return data;
}

// (projects & tasks of current user live in their own api files)

// ---------- Management ----------

/**
 * An account as the project and task pickers see it: an id and a username, nothing else.
 *
 * It is the one user listing a MANAGER may read (see listUserDirectory), so it carries no
 * account details — the fuller AdminUser above is behind the administrator-only endpoints.
 */
export interface UserDirectoryEntry {
  id: string;
  username: string;
}

/** Every account as an id/username pair, for the project and task pickers. */
export async function listUserDirectory(): Promise<UserDirectoryEntry[]> {
  const { data } = await api.get<UserDirectoryEntry[]>("/users/directory");
  return data;
}

// ---------- Admin (administrator only) ----------
export async function listUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<AdminUser[]>("/users");
  return data;
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<AdminUser> {
  const { data } = await api.post<AdminUser>("/users", payload);
  return data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/users/${id}`);
  return data;
}

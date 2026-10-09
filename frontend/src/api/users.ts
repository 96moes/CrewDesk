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
  managerId?: string | null;
  manager?: { id: string; username: string } | null;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  managerId?: string;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  role?: UserRole;
  fullName?: string;
  phone?: string;
  managerId?: string;
}

// ---------- Self ----------
export interface ProfileResponse {
  id: string;
  username: string;
  role: UserRole;
  fullName?: string | null;
  phone?: string | null;
  managerId?: string | null;
  manager?: { id: string; username: string } | null;
}

export async function getMyProfile(): Promise<ProfileResponse> {
  const { data } = await api.get<ProfileResponse>("/users/me/profile");
  return data;
}

// (projects & tasks of current user live in their own api files)

// ---------- Admin ----------
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

// src/api/auth.ts
import { api, publicApi } from "./axios";

export type UserRole = "REGISTRAR" | "REPORT_VIEWER" | "ADMIN";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  role: UserRole;
}

export interface CurrentUser {
  id: string;
  username: string;
  role: UserRole;
  fullName?: string | null;
  phone?: string | null;
  managerId?: string | null;
  manager?: { id: string; username: string } | null;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await publicApi.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function getMe(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>("/users/me");
  return data;
}

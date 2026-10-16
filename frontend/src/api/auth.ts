// src/api/auth.ts
import { api, publicApi } from "./axios";

/**
 * Role of an account.
 *
 * USER is an ordinary account holder. MANAGER runs the site content like an administrator —
 * projects, tasks, media, the message queue — and ADMIN does that too, plus managing user
 * accounts. The rule itself lives in src/lib/roles.ts.
 */
export type UserRole = "USER" | "MANAGER" | "ADMIN";

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
  /** Ids of the groups this user belongs to. The groups they manage carry their id instead. */
  groupIds: string[];
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await publicApi.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function getMe(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>("/users/me");
  return data;
}

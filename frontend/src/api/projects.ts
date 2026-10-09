// src/api/projects.ts
import { api } from "./axios";

export type ProjectStatus = "active" | "paused" | "done";

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  managerId?: string | null;
  manager?: { id: string; username: string } | null;
  createdAt: string;
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  status?: ProjectStatus;
  managerId?: string;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  managerId?: string;
}

export async function listProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>("/projects");
  return data;
}

export async function getMyProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>("/users/me/projects");
  return data;
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<Project> {
  const { data } = await api.post<Project>("/projects", payload);
  return data;
}

export async function updateProject(
  id: string,
  payload: UpdateProjectPayload,
): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${id}`, payload);
  return data;
}

export async function deleteProject(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/projects/${id}`);
  return data;
}

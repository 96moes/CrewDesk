// src/api/tasks.ts
import { api } from "./axios";

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  deadline?: string | null;
  projectId?: string | null;
  project?: { id: string; title: string } | null;
  assigneeId?: string | null;
  assignee?: { id: string; username: string } | null;
  createdAt: string;
}

export interface CreateTaskPayload {
  title: string;
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  deadline?: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export async function listTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/tasks");
  return data;
}

export async function getMyTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/users/me/tasks");
  return data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const { data } = await api.post<Task>("/tasks", payload);
  return data;
}

export async function updateTask(
  id: string,
  payload: UpdateTaskPayload,
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, payload);
  return data;
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/tasks/${id}`);
  return data;
}

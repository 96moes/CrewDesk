import { api } from "./axios";

export interface GroupMember {
  id: string;
  username: string;
  fullName: string | null;
  phone: string | null;
}

export interface ManagedGroup {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  createdAt: string;
  members: GroupMember[];
}

export type BulkMessageStatus = "pending" | "sent";

export interface BulkMessageEntry {
  id: string;
  phone: string;
  content: string;
  status: BulkMessageStatus;
  sentAt: string | null;
}

export interface BulkMessageRequest {
  id: string;
  groupName: string;
  requestedBy: string;
  content: string;
  createdAt: string;
  messages: BulkMessageEntry[];
}

export async function getMyGroups(): Promise<ManagedGroup[]> {
  const { data } = await api.get<ManagedGroup[]>("/groups/my");
  return data;
}

export async function createGroup(name: string): Promise<ManagedGroup> {
  const { data } = await api.post<ManagedGroup>("/groups", { name });
  return data;
}

export async function addGroupMember(
  groupId: string,
  phone: string,
): Promise<ManagedGroup> {
  const { data } = await api.post<ManagedGroup>(`/groups/${groupId}/members`, {
    phone,
  });
  return data;
}

export async function removeGroupMember(
  groupId: string,
  userId: string,
): Promise<ManagedGroup> {
  const { data } = await api.delete<ManagedGroup>(
    `/groups/${groupId}/members/${userId}`,
  );
  return data;
}

export async function submitGroupMessage(
  groupId: string,
  content: string,
): Promise<{ id: string; recipientCount: number }> {
  const { data } = await api.post<{ id: string; recipientCount: number }>(
    `/groups/${groupId}/messages`,
    { content },
  );
  return data;
}

export async function getBulkMessageRequests(): Promise<BulkMessageRequest[]> {
  const { data } = await api.get<BulkMessageRequest[]>(
    "/groups/admin/bulk-messages",
  );
  return data;
}

export async function markBulkMessageSent(
  messageId: string,
): Promise<BulkMessageEntry> {
  const { data } = await api.patch<BulkMessageEntry>(
    `/groups/admin/bulk-messages/${messageId}/sent`,
  );
  return data;
}

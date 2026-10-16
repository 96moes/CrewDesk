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
  /** The user who manages this group; only they may change members or post for it. */
  managerId: string;
  managerName: string;
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

/**
 * An account offered to a group manager as a search result.
 *
 * It is what a name search can return, so it carries no phone number — only the last four digits
 * of one, enough to recognise the person the manager had in mind.
 */
export interface GroupMemberCandidate {
  id: string;
  username: string;
  fullName: string | null;
  /** Last four digits of the registered phone number, or null when none is registered. */
  phoneHint: string | null;
  /** Already in this group, so the result is shown rather than silently missing. */
  alreadyMember: boolean;
}

/**
 * Who to add to the group: the id the picker found, or — for clients that already have it — the
 * account's registered phone number.
 */
export interface AddGroupMemberPayload {
  userId?: string;
  phone?: string;
}

export async function getMyGroups(): Promise<ManagedGroup[]> {
  const { data } = await api.get<ManagedGroup[]>("/groups/my");
  return data;
}

export async function createGroup(name: string): Promise<ManagedGroup> {
  const { data } = await api.post<ManagedGroup>("/groups", { name });
  return data;
}

/**
 * Accounts matching what the manager typed, by name or by phone number.
 *
 * The API only answers for a group the caller manages and returns nothing below three
 * characters, so a short query is not worth a round trip.
 */
export async function searchGroupMemberCandidates(
  groupId: string,
  query: string,
): Promise<GroupMemberCandidate[]> {
  const { data } = await api.get<GroupMemberCandidate[]>(
    `/groups/${groupId}/member-candidates`,
    { params: { q: query } },
  );
  return data;
}

export async function addGroupMember(
  groupId: string,
  payload: AddGroupMemberPayload,
): Promise<ManagedGroup> {
  const { data } = await api.post<ManagedGroup>(
    `/groups/${groupId}/members`,
    payload,
  );
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

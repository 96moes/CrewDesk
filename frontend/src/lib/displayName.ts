// src/lib/displayName.ts
/**
 * How a person is named wherever a human reads it: their full name when they have one, otherwise
 * the username they log in with. The API returns both, so every list has to decide — this decides
 * once, and the backend does the same for the names it embeds in its own responses
 * (see displayName in backend/src/groups/groups.service.ts).
 */
export function displayName(person: {
  fullName?: string | null;
  username: string;
}): string {
  return person.fullName?.trim() || person.username;
}

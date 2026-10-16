// src/lib/apiError.ts
/**
 * The message to show for a failed request.
 *
 * The API answers with a string, or — when validation rejects several fields at once — with a
 * list, so both shapes are read here rather than at every call site. The fallback is used when
 * the request failed without an answer at all, which is what a network error looks like.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;

  if (Array.isArray(message)) return message.join("، ");
  return message ?? fallback;
}

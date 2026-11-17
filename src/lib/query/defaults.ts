import type { DefaultOptions } from "@tanstack/react-query";
import { isClientApiError } from "@/lib/api/errors";

/**
 * 4xx responses (bad input, auth, not found, rate limit) won't change on
 * retry — fail fast. Network/timeout/5xx errors get one more attempt.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (isClientApiError(error)) return false;
  return failureCount < 1;
}

export const queryDefaultOptions: DefaultOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: shouldRetryQuery,
    // File links are signed and valid for at least an hour; refresh data the
    // user comes back to after a long break so links don't go stale on screen.
    refetchOnWindowFocus: (query) =>
      Date.now() - query.state.dataUpdatedAt > 45 * 60_000,
  },
};

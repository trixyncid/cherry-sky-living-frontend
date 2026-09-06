import { QueryClient } from "@tanstack/react-query";
import { queryDefaultOptions } from "@/lib/query/defaults";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: queryDefaultOptions,
  });
}

let browserQueryClient: QueryClient | undefined;

/** Browser singleton; new client per server request (TanStack App Router SSR). */
export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function createPrefetchQueryClient() {
  return makeQueryClient();
}

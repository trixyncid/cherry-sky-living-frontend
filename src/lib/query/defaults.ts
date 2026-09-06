import type { DefaultOptions } from "@tanstack/react-query";

export const queryDefaultOptions: DefaultOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    // Admin/tenant client components SSR without session cookies. Public
    // routes prefetch on the server and dehydrate into this client.
    enabled: typeof window !== "undefined",
  },
};

import type { DefaultOptions } from "@tanstack/react-query";

export const queryDefaultOptions: DefaultOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
};

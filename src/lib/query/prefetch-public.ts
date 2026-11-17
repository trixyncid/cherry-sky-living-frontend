import type { QueryClient } from "@tanstack/react-query";
import type { ApiFetchOptions } from "@/lib/api/client";
import {
  getPublicProperty,
  listPublicProperties,
} from "@/lib/api/public/properties";
import { searchPublicUnits } from "@/lib/api/public/search";
import { searchFiltersToApiParams } from "@/lib/api/public/search-contract";
import { publicKeys } from "@/lib/query/keys";
import type { SearchFilters } from "@/lib/types";

/**
 * Server-side public catalogue fetches: anonymous, so they can share Next's
 * data cache (60s) across visitors. Never use for authenticated requests.
 */
const PUBLIC_SSR_FETCH: ApiFetchOptions = {
  next: { revalidate: 60 },
  timeoutMs: 15_000,
};

export async function prefetchPublicProperties(queryClient: QueryClient) {
  try {
    await queryClient.prefetchQuery({
      queryKey: publicKeys.properties.all(),
      queryFn: () => listPublicProperties(PUBLIC_SSR_FETCH),
    });
  } catch {
    // Client hooks render load/error states from an empty cache.
  }
}

export async function prefetchPublicProperty(
  queryClient: QueryClient,
  id: string,
) {
  try {
    await queryClient.prefetchQuery({
      queryKey: publicKeys.properties.detail(id),
      queryFn: () => getPublicProperty(id, PUBLIC_SSR_FETCH),
    });
  } catch {
    // 404 / network — KostRoutePage distinguishes error vs not-found.
  }
}

export async function prefetchPublicSearch(
  queryClient: QueryClient,
  filters: SearchFilters,
) {
  const apiParams = searchFiltersToApiParams(filters);
  try {
    await queryClient.prefetchQuery({
      queryKey: publicKeys.search.list(apiParams as Record<string, unknown>),
      queryFn: () => searchPublicUnits(apiParams, PUBLIC_SSR_FETCH),
      staleTime: 30_000,
    });
  } catch {
    // Search page already shows loadError from the client query.
  }
}

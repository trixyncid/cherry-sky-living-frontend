/**
 * Search Kost Page - Cari Kost
 * Search and filter unit types via GET /public/search
 */

import { dehydrate } from "@tanstack/react-query";
import { PublicHydration } from "@/components/query/public-hydration";
import {
  queryStringToFilters,
  searchParamsToURLSearchParams,
} from "@/lib/api/public/search-contract";
import { createPrefetchQueryClient } from "@/lib/query/get-query-client";
import {
  prefetchPublicProperties,
  prefetchPublicSearch,
} from "@/lib/query/prefetch-public";
import { SearchKostsView } from "./search-kosts-view";

export default async function SearchKostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const filters = queryStringToFilters(
    searchParamsToURLSearchParams(rawParams),
  );
  const queryClient = createPrefetchQueryClient();
  await Promise.all([
    prefetchPublicSearch(queryClient, filters),
    prefetchPublicProperties(queryClient),
  ]);

  return (
    <PublicHydration state={dehydrate(queryClient)}>
      <SearchKostsView initialFilters={filters} />
    </PublicHydration>
  );
}

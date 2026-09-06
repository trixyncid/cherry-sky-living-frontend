/**
 * Homepage — cinematic hero, trust sections, listings, FAQ
 */

import { dehydrate } from "@tanstack/react-query";
import { PublicHydration } from "@/components/query/public-hydration";
import { createPrefetchQueryClient } from "@/lib/query/get-query-client";
import { prefetchPublicProperties } from "@/lib/query/prefetch-public";
import { HomeView } from "./home-view";

export default async function HomePage() {
  const queryClient = createPrefetchQueryClient();
  await prefetchPublicProperties(queryClient);

  return (
    <PublicHydration state={dehydrate(queryClient)}>
      <HomeView />
    </PublicHydration>
  );
}

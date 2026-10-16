"use client";

import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { Hero } from "@/components/sections/Hero";
import { HomeContinuation } from "@/components/sections/HomeContinuation";
import { HomeJourney } from "@/components/sections/HomeJourney";
import { HomeOverview } from "@/components/sections/HomeOverview";
import { HomeResidences } from "@/components/sections/HomeResidences";
import { useKosts } from "@/lib/hooks/use-kost-data";

/**
 * Homepage — one focused path: hero + search → who it's for → residence
 * overview → available rooms → how it works → final CTA (in the footer).
 * Stats/story live on /about, residence cards on /residences, and
 * Facilities / Location / FAQ have their own pages (navbar + footer).
 */
export function HomeView() {
  const { data: kosts, isLoading } = useKosts();

  return (
    <PublicPageShell>
      <Hero kosts={kosts} isLoading={isLoading} />
      <HomeContinuation kosts={kosts} />
      <HomeOverview kosts={kosts} isLoading={isLoading} />
      <HomeResidences kosts={kosts} isLoading={isLoading} />
      <HomeJourney />
    </PublicPageShell>
  );
}

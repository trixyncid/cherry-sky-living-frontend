"use client";

import { PublicPageShell } from "@/components/layout/PublicPageShell";
import {
  AboutHeroSection,
  AboutNumbersSection,
  AboutStorySection,
  AboutValuesSection,
} from "@/components/sections/AboutSections";
import { HomeJourney } from "@/components/sections/HomeJourney";
import { useKosts } from "@/lib/hooks/use-kost-data";

export function AboutView() {
  const { data: kosts, isLoading } = useKosts();
  return (
    <PublicPageShell>
      <AboutHeroSection kosts={kosts} />
      <AboutStorySection />
      <AboutValuesSection />
      <AboutNumbersSection kosts={kosts} isLoading={isLoading} />
      <HomeJourney />
    </PublicPageShell>
  );
}

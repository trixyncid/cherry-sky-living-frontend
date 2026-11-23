"use client";

import { useTranslations } from "next-intl";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { HomeFaq } from "@/components/sections/HomeFaq";
import { HomeJourney } from "@/components/sections/HomeJourney";
import { PageHero } from "@/components/sections/PageHero";

/** How it works — the four steps in full, then the FAQ for the details. */
export function HowItWorksView() {
  const t = useTranslations("home.journey");

  return (
    <PublicPageShell>
      <PageHero
        eyebrow={t("eyebrow")}
        titleLead={t("titleLead")}
        titleAccent={t("titleAccent")}
        description={t("description")}
        photo="/assets/skykost.jpeg"
      />
      <HomeJourney />
      <HomeFaq />
    </PublicPageShell>
  );
}

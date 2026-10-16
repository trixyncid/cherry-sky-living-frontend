"use client";

import { useTranslations } from "next-intl";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { LocationSection } from "@/components/sections/LocationSection";
import { PageHero } from "@/components/sections/PageHero";
import { useKosts } from "@/lib/hooks/use-kost-data";

export function LocationView() {
  const t = useTranslations("location");
  const { data: kosts, isLoading } = useKosts();

  return (
    <PublicPageShell>
      <PageHero
        eyebrow={t("eyebrow")}
        titleLead={t("titleLead")}
        titleAccent={t("titleAccent")}
        description={t("description")}
        photo="/assets/skykost.jpeg"
      />
      <LocationSection kosts={kosts} isLoading={isLoading} />
    </PublicPageShell>
  );
}

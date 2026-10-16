"use client";

import { useTranslations } from "next-intl";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { HomeProperties } from "@/components/sections/HomeProperties";
import { PageHero } from "@/components/sections/PageHero";
import { useKosts } from "@/lib/hooks/use-kost-data";

export function ResidencesView() {
  const t = useTranslations();
  const { data: kosts, isLoading } = useKosts();
  const rooms = (kosts ?? []).reduce((s, k) => s + k.availableRooms, 0);

  return (
    <PublicPageShell>
      <PageHero
        eyebrow={
          isLoading
            ? t("home.houses.eyebrow")
            : t("hero.availableNow", { count: rooms })
        }
        live={!isLoading && rooms > 0}
        titleLead={t("home.houses.titleLead")}
        titleAccent={t("home.houses.titleAccent")}
        description={t("home.houses.description")}
        photo={kosts?.[0]?.thumbnail}
      />
      <HomeProperties kosts={kosts} isLoading={isLoading} asPage />
    </PublicPageShell>
  );
}

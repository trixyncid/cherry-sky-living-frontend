"use client";

import { useTranslations } from "next-intl";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { Amenities } from "@/components/sections/Amenities";
import { PageHero } from "@/components/sections/PageHero";
import { useKosts } from "@/lib/hooks/use-kost-data";

export function FacilitiesView() {
  const t = useTranslations("home.amenities");
  const { data: kosts } = useKosts();
  const roomPhoto = (kosts ?? []).flatMap((k) =>
    k.roomTypes.flatMap((rt) => rt.images),
  )[3];

  return (
    <PublicPageShell>
      <PageHero
        eyebrow={t("badge")}
        titleLead={t("titleLead")}
        titleAccent={t("titleAccent")}
        description={t("description")}
        photo={roomPhoto}
      />
      <Amenities kosts={kosts} asPage />
    </PublicPageShell>
  );
}

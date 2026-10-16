"use client";

import { useTranslations } from "next-intl";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { HomeFaq } from "@/components/sections/HomeFaq";
import { PageHero } from "@/components/sections/PageHero";

export function FaqView() {
  const t = useTranslations("home.faq");

  return (
    <PublicPageShell>
      <PageHero
        eyebrow={t("eyebrow")}
        titleLead={t("title")}
        description={t("description")}
      />
      <HomeFaq asPage />
    </PublicPageShell>
  );
}

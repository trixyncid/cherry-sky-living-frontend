/**
 * About Page — story, values, live numbers, how it works.
 */

import { dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicHydration } from "@/components/query/public-hydration";
import { createPrefetchQueryClient } from "@/lib/query/get-query-client";
import { prefetchPublicProperties } from "@/lib/query/prefetch-public";
import { AboutView } from "./about-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.hero" });
  return {
    title: `${t("title")} · Cherry Sky Living`,
    description: t("description"),
  };
}

export default async function AboutPage() {
  const queryClient = createPrefetchQueryClient();
  await prefetchPublicProperties(queryClient);
  return (
    <PublicHydration state={dehydrate(queryClient)}>
      <AboutView />
    </PublicHydration>
  );
}

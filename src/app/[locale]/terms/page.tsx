/**
 * Terms page — readable document with sticky table of contents.
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalView } from "./legal-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms.hero" });
  return {
    title: `${t("title")} · Cherry Sky Living`,
    description: t("description"),
  };
}

export default function Page() {
  return <LegalView />;
}

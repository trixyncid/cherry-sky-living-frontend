/**
 * Homepage — the landing page: hero + availability search, choose a
 * property, its scroll-video journey, rooms, facilities, then the shared
 * sections. Admin content is loaded (and cached by tag) on the server.
 */

import { dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingView } from "@/components/landing/LandingView";
import { PublicHydration } from "@/components/query/public-hydration";
import type { PublicProperty } from "@/lib/api/public/properties";
import { getLandingContent } from "@/lib/landing/get-landing";
import { createPrefetchQueryClient } from "@/lib/query/get-query-client";
import { publicKeys } from "@/lib/query/keys";
import { prefetchPublicProperties } from "@/lib/query/prefetch-public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.meta" });
  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    alternates: { languages: { id: "/id", en: "/en" } },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale === "en" ? "en_US" : "id_ID",
      images: [
        {
          url: "/assets/cherry-kost.jpeg",
          width: 1376,
          height: 768,
          alt: "Cherry Kost, Medan",
        },
      ],
    },
  };
}

export default async function HomePage() {
  const queryClient = createPrefetchQueryClient();
  const [content] = await Promise.all([
    getLandingContent(),
    prefetchPublicProperties(queryClient),
  ]);

  // One LodgingBusiness per property, from the live catalogue.
  const rows =
    queryClient.getQueryData<PublicProperty[]>(publicKeys.properties.all()) ??
    [];
  const jsonLd = rows.map((p) => {
    const extra = content.properties.find((c) =>
      p.name.toLowerCase().includes(c.match),
    );
    return {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: p.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: p.address,
        addressLocality: p.city,
        addressCountry: "ID",
      },
      ...(extra?.geo
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: extra.geo.lat,
              longitude: extra.geo.lng,
            },
          }
        : {}),
      ...(extra ? { image: extra.exteriorPhoto } : {}),
    };
  });

  return (
    <PublicHydration state={dehydrate(queryClient)}>
      {jsonLd.length > 0 ? (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from our own catalogue; "<" is escaped
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <LandingView content={content} />
    </PublicHydration>
  );
}

/**
 * Rooms page hero — PageHero with live stats and the search panel.
 */

"use client";

import { useTranslations } from "next-intl";
import { HeroSearchBar } from "@/components/sections/HeroSearchBar";
import { PageHero } from "@/components/sections/PageHero";
import { useKosts } from "@/lib/hooks/use-kost-data";
import type { SearchFilters } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

interface SearchHeroProps {
  initialFilters?: SearchFilters;
  onSearchSubmit?: (filters: SearchFilters) => void;
}

export function SearchHero({
  initialFilters,
  onSearchSubmit,
}: SearchHeroProps) {
  const t = useTranslations("search");
  const { data: kosts, isLoading } = useKosts();
  const availableRooms = (kosts ?? []).reduce(
    (sum, kost) => sum + kost.availableRooms,
    0,
  );
  const prices = (kosts ?? [])
    .map((kost) => kost.priceRange.min)
    .filter((price) => price > 0);
  const fromPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const roomPhoto = (kosts ?? []).flatMap((k) =>
    k.roomTypes.flatMap((rt) => rt.images),
  )[0];

  const stats = [
    { label: t("statRooms"), value: String(availableRooms) },
    {
      label: t("statFrom"),
      value: fromPrice > 0 ? formatCurrency(fromPrice, { compact: true }) : "—",
    },
  ];

  return (
    <PageHero
      eyebrow={t("pageEyebrow")}
      live={availableRooms > 0}
      titleLead={t("titleLead")}
      titleAccent={t("titleAccent")}
      description={t("subtitle")}
      photo={roomPhoto}
    >
      <div className="flex max-w-6xl flex-col gap-8">
        <dl className="flex divide-x divide-white/15">
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 first:pl-0">
              <dd className="text-[clamp(1.25rem,2vw,1.6rem)] font-semibold tracking-tight tabular-nums">
                {isLoading ? "…" : stat.value}
              </dd>
              <dt className="mt-1 text-xs text-white/65">{stat.label}</dt>
            </div>
          ))}
        </dl>
        <div className="text-left text-fg">
          <HeroSearchBar
            initialFilters={initialFilters}
            onSubmit={onSearchSubmit}
            showQuickFilters={false}
            overlapping={false}
          />
        </div>
      </div>
    </PageHero>
  );
}

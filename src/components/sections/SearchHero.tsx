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
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          {stats.map((stat) => (
            <p
              key={stat.label}
              className="inline-flex items-baseline gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 backdrop-blur-md"
            >
              <span className="text-lg font-semibold tabular-nums">
                {isLoading ? "…" : stat.value}
              </span>
              <span className="text-sm text-white/70">{stat.label}</span>
            </p>
          ))}
        </div>
        <div className="text-left text-[#141414]">
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

/**
 * Glassmorphic property search dock
 * Primary search query: property, keyword, price. Submit to apply.
 * Quick pills (homepage) preset availability / duration before navigating.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { SelectMenu } from "@/components/shared/select-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { listPublicProperties } from "@/lib/api/public/properties";
import {
  filtersFromPriceBand,
  filtersToQueryString,
  hasCustomPriceRange,
  priceBandFromFilters,
  type SearchPriceBand,
} from "@/lib/api/public/search-contract";
import { publicKeys } from "@/lib/query/keys";
import type { SearchFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HeroSearchBarProps {
  initialFilters?: SearchFilters;
  onSubmit?: (filters: SearchFilters) => void;
  overlapping?: boolean;
  /** Homepage shortcuts. Hidden on the search page — refine lives in the toolbar. */
  showQuickFilters?: boolean;
}

function FieldLabel({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-fg-muted">
      <Icon name={icon} size={14} />
      {children}
    </span>
  );
}

export function HeroSearchBar({
  initialFilters,
  onSubmit,
  overlapping = true,
  showQuickFilters = true,
}: HeroSearchBarProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [propertyId, setPropertyId] = useState(
    initialFilters?.propertyId ?? "",
  );
  const [priceBand, setPriceBand] = useState<SearchPriceBand>(
    priceBandFromFilters(initialFilters ?? {}),
  );
  const [availability, setAvailability] = useState<"available" | "all">(
    initialFilters?.availability ?? "all",
  );
  const [durationDays, setDurationDays] = useState<number | undefined>(
    initialFilters?.durationDays,
  );

  const initialPropertyId = initialFilters?.propertyId ?? "";
  const initialPriceMin = initialFilters?.priceMin;
  const initialPriceMax = initialFilters?.priceMax;
  const initialAvailability = initialFilters?.availability ?? "all";
  const initialDurationDays = initialFilters?.durationDays;

  useEffect(() => {
    setPropertyId(initialPropertyId);
  }, [initialPropertyId]);

  useEffect(() => {
    setPriceBand(
      priceBandFromFilters({
        priceMin: initialPriceMin,
        priceMax: initialPriceMax,
      }),
    );
  }, [initialPriceMin, initialPriceMax]);

  useEffect(() => {
    setAvailability(initialAvailability);
  }, [initialAvailability]);

  useEffect(() => {
    setDurationDays(initialDurationDays);
  }, [initialDurationDays]);

  const propertiesQuery = useQuery({
    queryKey: publicKeys.properties.all(),
    queryFn: listPublicProperties,
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });
  const properties = propertiesQuery.data ?? [];

  const buildFilters = (overrides?: Partial<SearchFilters>): SearchFilters => {
    const price =
      priceBand === "any" && hasCustomPriceRange(initialFilters ?? {})
        ? {
            priceMin: initialFilters?.priceMin,
            priceMax: initialFilters?.priceMax,
          }
        : filtersFromPriceBand(priceBand);

    return {
      ...initialFilters,
      // No location filter: also clears a stale ?q= from older links.
      location: undefined,
      propertyId: propertyId || undefined,
      availability,
      durationDays,
      page: 1,
      ...price,
      ...overrides,
    };
  };

  const commit = (next: SearchFilters) => {
    if (onSubmit) {
      onSubmit(next);
      return;
    }
    const qs = filtersToQueryString(next);
    router.push(qs ? `/search-kosts?${qs}` : "/search-kosts");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    commit(buildFilters());
  };

  const fieldClass = "h-12 font-medium";

  const pills: {
    id: string;
    label: string;
    onClick: () => void;
    active: boolean;
  }[] = [
    {
      id: "all",
      label: t("filterAll"),
      active: availability === "all" && !durationDays,
      onClick: () => {
        setAvailability("all");
        setDurationDays(undefined);
      },
    },
    {
      id: "available",
      label: t("filterAvailable"),
      active: availability === "available",
      onClick: () => setAvailability("available"),
    },
    {
      id: "monthly",
      label: t("filterMonthly"),
      active: durationDays === 30,
      onClick: () => setDurationDays(durationDays === 30 ? undefined : 30),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className={cn("relative z-20 w-full", overlapping && "-mb-14 md:-mb-16")}
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full rounded-[1.25rem] bg-white p-3 shadow-[0_24px_60px_-34px_rgb(11_11_13/0.35)] sm:p-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <FieldLabel icon="apartment">{t("lookingFor")}</FieldLabel>
              <SelectMenu
                aria-label={t("lookingFor")}
                value={propertyId}
                onChange={setPropertyId}
                options={[
                  { value: "", label: t("propertyAny") },
                  ...properties.map((property) => ({
                    value: property.id,
                    label: property.name,
                  })),
                ]}
                className={fieldClass}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <FieldLabel icon="payments">{t("priceRange")}</FieldLabel>
              <SelectMenu
                aria-label={t("priceRange")}
                value={priceBand}
                onChange={(value) => setPriceBand(value as SearchPriceBand)}
                options={[
                  { value: "any", label: t("priceAny") },
                  { value: "under1", label: t("priceUnder1m") },
                  { value: "1to2", label: t("price1to2m") },
                  { value: "2to3", label: t("price2to3m") },
                  { value: "3plus", label: t("price3mPlus") },
                ]}
                className={fieldClass}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full shrink-0 rounded-full bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-hover md:w-auto"
          >
            <Icon name="search" size={18} className="mr-2" />
            {t("findProperties")}
          </Button>
        </div>

        {showQuickFilters ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 px-1 pt-3">
            {pills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={pill.onClick}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  pill.active
                    ? "bg-brand text-white"
                    : "border border-white/20 bg-white/10 text-white/80 hover:bg-white/15",
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>
        ) : null}
      </form>
    </motion.div>
  );
}

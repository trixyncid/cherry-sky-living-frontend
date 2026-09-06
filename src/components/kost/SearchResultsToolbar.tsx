/**
 * Results refine bar — instant filters, sort, and dismissible chips.
 * Search intent (property / keyword / price) lives in the hero dock.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { listPublicProperties } from "@/lib/api/public/properties";
import {
  hasCustomPriceRange,
  priceBandFromFilters,
} from "@/lib/api/public/search-contract";
import { publicKeys } from "@/lib/query/keys";
import type { SearchFilters } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

interface SearchResultsToolbarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset: () => void;
}

type Chip = {
  id: string;
  label: string;
  clear: Partial<SearchFilters>;
};

const SORT_OPTIONS = [
  { id: "property-asc", labelKey: "sortProperty" },
  { id: "price-asc", labelKey: "sortPriceAsc" },
  { id: "price-desc", labelKey: "sortPriceDesc" },
  { id: "newest", labelKey: "sortNewest" },
] as const;

function priceChipLabel(
  filters: SearchFilters,
  t: ReturnType<typeof useTranslations>,
): string | null {
  if (filters.priceMin === undefined && filters.priceMax === undefined) {
    return null;
  }

  const band = priceBandFromFilters(filters);
  if (band === "under1") return t("priceUnder1m");
  if (band === "1to2") return t("price1to2m");
  if (band === "2to3") return t("price2to3m");
  if (band === "3plus") return t("price3mPlus");

  if (hasCustomPriceRange(filters)) {
    const min =
      filters.priceMin !== undefined
        ? formatCurrency(filters.priceMin, { compact: true })
        : t("priceAny");
    const max =
      filters.priceMax !== undefined
        ? formatCurrency(filters.priceMax, { compact: true })
        : t("price3mPlus");
    return `${min} – ${max}`;
  }

  return null;
}

export function SearchResultsToolbar({
  filters,
  onFiltersChange,
  onReset,
}: SearchResultsToolbarProps) {
  const t = useTranslations("search");
  const propertiesQuery = useQuery({
    queryKey: publicKeys.properties.all(),
    queryFn: listPublicProperties,
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });
  const properties = propertiesQuery.data ?? [];

  const patch = (next: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...next, page: 1 });
  };

  const availabilityOn = filters.availability === "available";
  const monthlyOn = filters.durationDays === 30;

  const propertyName = properties.find(
    (property) => property.id === filters.propertyId,
  )?.name;

  const chips: Chip[] = [];
  if (filters.location?.trim()) {
    chips.push({
      id: "location",
      label: filters.location.trim(),
      clear: { location: undefined },
    });
  }
  if (filters.propertyId) {
    chips.push({
      id: "property",
      label: propertyName ?? t("propertyLabel"),
      clear: { propertyId: undefined },
    });
  }
  const priceLabel = priceChipLabel(filters, t);
  if (priceLabel) {
    chips.push({
      id: "price",
      label: priceLabel,
      clear: { priceMin: undefined, priceMax: undefined },
    });
  }

  const hasChips = chips.length > 0;
  const isDefault =
    !filters.location?.trim() &&
    !filters.propertyId &&
    filters.priceMin === undefined &&
    filters.priceMax === undefined &&
    !availabilityOn &&
    !monthlyOn &&
    (filters.sortBy ?? "property-asc") === "property-asc";

  return (
    <div className="mb-8 space-y-3 rounded-[1.25rem] border border-[#e3e2e0] bg-white/80 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={availabilityOn}
            onClick={() =>
              patch({ availability: availabilityOn ? "all" : "available" })
            }
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              availabilityOn
                ? "bg-[#1a1c1a] text-white"
                : "border border-[#d5c3b8] bg-white text-[#51443c] hover:border-[#1a1c1a]/40",
            )}
          >
            {t("filterAvailable")}
          </button>
          <button
            type="button"
            aria-pressed={monthlyOn}
            onClick={() => patch({ durationDays: monthlyOn ? undefined : 30 })}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              monthlyOn
                ? "bg-[#1a1c1a] text-white"
                : "border border-[#d5c3b8] bg-white text-[#51443c] hover:border-[#1a1c1a]/40",
            )}
          >
            {t("filterMonthly")}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {!isDefault ? (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-[#1a1c1a] hover:underline"
            >
              {t("clearAll")}
            </button>
          ) : null}
          <label className="flex items-center gap-2 text-xs font-semibold text-[#83746b]">
            <Icon name="sort" size={16} />
            <span className="hidden sm:inline">{t("sortLabel")}</span>
            <select
              value={filters.sortBy ?? "property-asc"}
              onChange={(e) => {
                patch({
                  sortBy: e.target.value as NonNullable<SearchFilters["sortBy"]>,
                });
              }}
              className="rounded-lg border border-[#e3e2e0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1a1c1a] focus:border-[#1a1c1a] focus:outline-none focus:ring-2 focus:ring-[#1a1c1a]/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {hasChips ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#e3e2e0] pt-3">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => patch(chip.clear)}
              className="inline-flex items-center gap-1 rounded-full border border-[#d5c3b8] bg-white py-1 pl-3 pr-1.5 text-xs font-medium text-[#51443c] transition-colors hover:border-[#1a1c1a]/40 hover:text-[#1a1c1a]"
              aria-label={t("removeFilter", { label: chip.label })}
            >
              {chip.label}
              <Icon name="close" size={14} className="text-[#83746b]" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

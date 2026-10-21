/**
 * Results refine bar — instant filters, sort, and dismissible chips.
 * Search intent (property / keyword / price) lives in the hero dock.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { SelectMenu } from "@/components/shared/select-menu";
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
  const locale = useLocale();
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

  if (filters.startDate) {
    chips.push({
      id: "moveIn",
      label: t("moveInFrom", {
        date: new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
        }).format(new Date(`${filters.startDate}T00:00:00`)),
      }),
      clear: { startDate: undefined, endDate: undefined },
    });
  }

  const hasChips = chips.length > 0;
  const isDefault =
    !filters.location?.trim() &&
    !filters.propertyId &&
    !filters.startDate &&
    filters.priceMin === undefined &&
    filters.priceMax === undefined &&
    !availabilityOn &&
    !monthlyOn &&
    (filters.sortBy ?? "property-asc") === "property-asc";

  return (
    <div className="space-y-3 rounded-[1.25rem] bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={availabilityOn}
            onClick={() =>
              patch({ availability: availabilityOn ? "all" : "available" })
            }
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors",
              availabilityOn
                ? "bg-brand text-white"
                : "border border-line-strong bg-white text-fg-2 hover:border-fg",
            )}
          >
            {t("filterAvailable")}
          </button>
          <button
            type="button"
            aria-pressed={monthlyOn}
            onClick={() => patch({ durationDays: monthlyOn ? undefined : 30 })}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors",
              monthlyOn
                ? "bg-brand text-white"
                : "border border-line-strong bg-white text-fg-2 hover:border-fg",
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
              className="text-sm font-semibold text-fg underline-offset-4 hover:underline"
            >
              {t("clearAll")}
            </button>
          ) : null}
          <div className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
            <Icon name="sort" size={16} />
            <span className="hidden sm:inline">{t("sortLabel")}</span>
            <SelectMenu
              aria-label={t("sortLabel")}
              value={filters.sortBy ?? "property-asc"}
              onChange={(value) =>
                patch({
                  sortBy: value as NonNullable<SearchFilters["sortBy"]>,
                })
              }
              options={SORT_OPTIONS.map((option) => ({
                value: option.id,
                label: t(option.labelKey),
              }))}
              className="h-10 w-44 rounded-full pl-4 text-sm font-semibold"
              contentClassName="min-w-[13rem]"
            />
          </div>
        </div>
      </div>

      {hasChips ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-hover pt-3">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => patch(chip.clear)}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-canvas pl-3.5 pr-2 text-sm font-medium text-fg transition-colors hover:bg-line"
              aria-label={t("removeFilter", { label: chip.label })}
            >
              {chip.label}
              <Icon name="close" size={16} className="text-fg-muted" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

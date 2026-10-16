/**
 * Hero quick search (landing-page-instructions §5.2):
 * residence + monthly budget + move-in date → filtered room list.
 * A move-in date searches for rooms free for the first month.
 */

"use client";

import { addDays, format, startOfToday } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { ArrowPillButton } from "@/components/shared/ArrowPill";
import { SelectMenu } from "@/components/shared/select-menu";
import { useRouter } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import {
  filtersFromPriceBand,
  filtersToQueryString,
  type SearchPriceBand,
} from "@/lib/api/public/search-contract";
import type { Kost, SearchFilters } from "@/lib/types";

const FIRST_MONTH_DAYS = 30;

export function HeroQuickSearch({ kosts = [] }: { kosts?: Kost[] }) {
  const t = useTranslations("hero");
  const tSearch = useTranslations("search");
  const router = useRouter();
  const [propertyId, setPropertyId] = useState("");
  const [priceBand, setPriceBand] = useState<SearchPriceBand>("any");
  const [moveIn, setMoveIn] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const filters: SearchFilters = {
      propertyId: propertyId || undefined,
      ...filtersFromPriceBand(priceBand),
      page: 1,
    };
    if (moveIn) {
      filters.startDate = moveIn;
      filters.endDate = format(
        addDays(new Date(`${moveIn}T00:00:00`), FIRST_MONTH_DAYS),
        "yyyy-MM-dd",
      );
    }
    track("filter_used", {
      location: "hero",
      property: propertyId || "all",
      budget: priceBand,
      move_in: Boolean(moveIn),
    });
    const qs = filtersToQueryString(filters);
    router.push(qs ? `/search-kosts?${qs}` : "/search-kosts");
  };

  const fieldLabel =
    "mb-1.5 block px-1 text-[13px] font-semibold text-[#6b6b6b]";

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={t("searchTitle")}
      className="grid gap-3 rounded-[1.25rem] bg-white p-3 shadow-[0_24px_60px_-34px_rgb(20_16_14/0.45)] sm:grid-cols-2 sm:p-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
    >
      <div>
        <label htmlFor="hero-search-property" className={fieldLabel}>
          {t("searchProperty")}
        </label>
        <SelectMenu
          id="hero-search-property"
          value={propertyId}
          onChange={setPropertyId}
          options={[
            { value: "", label: tSearch("propertyAny") },
            ...kosts.map((k) => ({ value: k.id, label: k.name })),
          ]}
          placeholder={tSearch("propertyAny")}
          className="h-12"
        />
      </div>
      <div>
        <label htmlFor="hero-search-budget" className={fieldLabel}>
          {t("searchBudget")}
        </label>
        <SelectMenu
          id="hero-search-budget"
          value={priceBand}
          onChange={(v) => setPriceBand((v || "any") as SearchPriceBand)}
          options={[
            { value: "any", label: tSearch("priceAny") },
            { value: "under1", label: tSearch("priceUnder1m") },
            { value: "1to2", label: tSearch("price1to2m") },
            { value: "2to3", label: tSearch("price2to3m") },
            { value: "3plus", label: tSearch("price3mPlus") },
          ]}
          className="h-12"
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-1">
        <label htmlFor="hero-search-movein" className={fieldLabel}>
          {t("searchMoveIn")}
        </label>
        <DatePicker
          id="hero-search-movein"
          value={moveIn}
          onChange={setMoveIn}
          fromDate={startOfToday()}
          placeholder={t("searchMoveInPlaceholder")}
          className="h-12"
        />
      </div>
      <ArrowPillButton
        type="submit"
        icon="search"
        className="sm:col-span-2 lg:col-span-1 lg:min-w-[12rem]"
      >
        {t("searchSubmit")}
      </ArrowPillButton>
    </form>
  );
}

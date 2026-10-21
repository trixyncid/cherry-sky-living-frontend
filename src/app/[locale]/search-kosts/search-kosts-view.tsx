"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { SearchPagination } from "@/components/kost/SearchPagination";
import { SearchResultsToolbar } from "@/components/kost/SearchResultsToolbar";
import { UnitTypeSearchGrid } from "@/components/kost/UnitTypeSearchGrid";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { SearchHero } from "@/components/sections/SearchHero";
import { Icon } from "@/components/shared/Icon";
import { track } from "@/lib/analytics";
import {
  createResetSearchFilters,
  filtersToQueryString,
} from "@/lib/api/public/search-contract";
import { useSearchUnitTypes } from "@/lib/hooks/use-kost-data";
import type { SearchFilters as SearchFiltersType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SearchKostsView({
  initialFilters,
}: {
  initialFilters: SearchFiltersType;
}) {
  const t = useTranslations("search");
  const [filters, setFilters] = useState<SearchFiltersType>(initialFilters);
  const [queryFilters, setQueryFilters] =
    useState<SearchFiltersType>(initialFilters);
  const [heroResetKey, setHeroResetKey] = useState(0);
  const [view, setView] = useState<"grid" | "table">("grid");
  const {
    data: unitTypes,
    total,
    unitTotal,
    pagination,
    isLoading,
    isFetching,
    error,
  } = useSearchUnitTypes(queryFilters);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("csl_search_view") === "table") setView("table");
    } catch {
      // Storage unavailable: default grid view.
    }
    track("view_room_list", { location: "search_page" });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setQueryFilters(filters), 400);
    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const qs = filtersToQueryString(filters);
    const next = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) {
      window.history.replaceState(null, "", next);
    }
  }, [filters]);

  const changeView = (next: "grid" | "table") => {
    setView(next);
    try {
      localStorage.setItem("csl_search_view", next);
    } catch {
      // Preference is a convenience only.
    }
  };

  const commitFilters = (next: SearchFiltersType) => {
    track("filter_used", { location: "search_page" });
    setFilters(next);
    setQueryFilters(next);
  };

  const handleReset = () => {
    commitFilters(createResetSearchFilters());
    setHeroResetKey((k) => k + 1);
  };

  const handlePageChange = (page: number) => {
    commitFilters({ ...filters, page });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHeroSearch = (next: SearchFiltersType) => {
    commitFilters({ ...next, page: 1 });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resultCount = unitTypes?.length ?? 0;

  return (
    <PublicPageShell>
      <SearchHero
        key={heroResetKey}
        initialFilters={filters}
        onSearchSubmit={handleHeroSearch}
      />

      <section
        ref={resultsRef}
        aria-labelledby="results-heading"
        className="w-full scroll-mt-16 px-5 pb-16 pt-6 sm:px-8"
      >
        <div className="mx-auto w-full max-w-[90rem]">
          {/* Sticky toolbar: filters, count and view stay reachable */}
          <div className="sticky top-16 z-30 -mx-5 bg-canvas/95 px-5 pb-3 pt-3 backdrop-blur-md sm:-mx-8 sm:px-8">
            <SearchResultsToolbar
              filters={filters}
              onFiltersChange={commitFilters}
              onReset={handleReset}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <h2
                id="results-heading"
                aria-live="polite"
                className="text-[15px] text-fg-2"
              >
                {t("unitTypeResultsCount", {
                  count: resultCount,
                  total,
                  units: unitTotal,
                })}
                {isFetching && !isLoading ? (
                  <span className="ml-2 font-medium text-brand">
                    {t("updating")}
                  </span>
                ) : null}
              </h2>
              <fieldset
                aria-label={t("viewLabel")}
                className="inline-flex rounded-full bg-white p-1"
              >
                {(["grid", "table"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={view === option}
                    onClick={() => changeView(option)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
                      view === option
                        ? "bg-brand text-white"
                        : "text-fg-2 hover:text-fg",
                    )}
                  >
                    <Icon
                      name={option === "grid" ? "grid_view" : "table_rows"}
                      size={16}
                    />
                    {option === "grid" ? t("viewGrid") : t("viewTable")}
                  </button>
                ))}
              </fieldset>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800">
              {t("loadError")}
            </p>
          ) : null}

          <div className="mt-5">
            <UnitTypeSearchGrid
              unitTypes={unitTypes ?? []}
              isLoading={isLoading}
              view={view}
              onReset={handleReset}
            />
          </div>
          {pagination ? (
            <SearchPagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          ) : null}
          <p className="mt-6 text-sm text-fg-muted">{t("resultsHint")}</p>
        </div>
      </section>
    </PublicPageShell>
  );
}

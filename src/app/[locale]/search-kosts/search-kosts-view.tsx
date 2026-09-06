"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { SearchPagination } from "@/components/kost/SearchPagination";
import { SearchResultsToolbar } from "@/components/kost/SearchResultsToolbar";
import { UnitTypeSearchGrid } from "@/components/kost/UnitTypeSearchGrid";
import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/layout/Footer";
import { SearchHero } from "@/components/sections/SearchHero";
import {
  createResetSearchFilters,
  filtersToQueryString,
} from "@/lib/api/public/search-contract";
import { useSearchUnitTypes } from "@/lib/hooks/use-kost-data";
import type { SearchFilters as SearchFiltersType } from "@/lib/types";

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

  const commitFilters = (next: SearchFiltersType) => {
    setFilters(next);
    setQueryFilters(next);
  };

  const handleReset = () => {
    const reset = createResetSearchFilters();
    commitFilters(reset);
    setHeroResetKey((k) => k + 1);
  };

  const handlePageChange = (page: number) => {
    commitFilters({ ...filters, page });
  };

  const handleHeroSearch = (next: SearchFiltersType) => {
    commitFilters({ ...next, page: 1 });
    resultsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const resultCount = unitTypes?.length ?? 0;

  return (
    <AppLayout>
      <SearchHero
        key={heroResetKey}
        initialFilters={filters}
        onSearchSubmit={handleHeroSearch}
      />

      <section className="w-full bg-[#faf9f6] px-6 pb-16 pt-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div ref={resultsRef} className="mb-6 scroll-mt-28 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
              {t("resultsEyebrow")}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-[#1a1c1a] md:text-3xl">
              {t("resultsTitle")}
            </h2>
            <p className="text-sm text-[#83746b]">
              {t("unitTypeResultsCount", {
                count: resultCount,
                total,
                units: unitTotal,
              })}
              {isFetching && !isLoading ? (
                <span className="ml-2 text-[#1a1c1a]">{t("updating")}</span>
              ) : null}
            </p>
          </div>

          {error ? (
            <p className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {t("loadError")}
            </p>
          ) : null}

          <SearchResultsToolbar
            filters={filters}
            onFiltersChange={commitFilters}
            onReset={handleReset}
          />

          <UnitTypeSearchGrid
            unitTypes={unitTypes ?? []}
            isLoading={isLoading}
          />
          {pagination ? (
            <SearchPagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          ) : null}
        </div>
      </section>

      <Footer />
    </AppLayout>
  );
}

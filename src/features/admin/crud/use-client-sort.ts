"use client";

import { useCallback, useMemo, useState } from "react";

import {
  compareSortValues,
  type SortDirection,
  type SortValue,
} from "@/features/admin/crud/sort-utils";

interface SortState {
  key: string;

  dir: SortDirection;
}

export function useClientSort<T>(
  items: T[],

  getSortValue: (item: T, key: string) => SortValue,

  defaultSortKey?: string,

  defaultSortDirection: SortDirection = "asc",
) {
  const [sort, setSort] = useState<SortState>({
    key: defaultSortKey ?? "",

    dir: defaultSortDirection,
  });

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }

      return { key, dir: "asc" };
    });
  }, []);

  const sortedItems = useMemo(() => {
    if (!sort.key) return items;

    return [...items].sort((a, b) =>
      compareSortValues(
        getSortValue(a, sort.key),

        getSortValue(b, sort.key),

        sort.dir,
      ),
    );
  }, [items, sort.key, sort.dir, getSortValue]);

  const setSortKey = useCallback((key: string) => {
    setSort((prev) => ({ ...prev, key }));
  }, []);

  const setSortDir = useCallback((dir: SortDirection) => {
    setSort((prev) => ({ ...prev, dir }));
  }, []);

  return {
    sortKey: sort.key,

    sortDir: sort.dir,

    toggleSort,

    sortedItems,

    setSortKey,

    setSortDir,
  };
}

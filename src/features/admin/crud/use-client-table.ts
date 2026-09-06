"use client";

import { useCallback } from "react";
import {
  DEFAULT_PAGE_SIZE,
  useClientPagination,
} from "@/features/admin/crud/use-client-pagination";
import { useClientSort } from "@/features/admin/crud/use-client-sort";
import type { SortDirection, SortValue } from "@/features/admin/crud/sort-utils";

interface UseClientTableOptions {
  pageSize?: number;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
}

export function useClientTable<T>(
  items: T[],
  getSortValue: (item: T, key: string) => SortValue,
  options: UseClientTableOptions = {},
) {
  const { sortKey, sortDir, toggleSort, sortedItems } = useClientSort(
    items,
    getSortValue,
    options.defaultSortKey,
    options.defaultSortDirection,
  );

  const { page, setPage, pageData, total, totalPages, pageSize, setPageSize } =
    useClientPagination(sortedItems, options.pageSize ?? DEFAULT_PAGE_SIZE);

  const onSort = useCallback(
    (key: string) => {
      toggleSort(key);
      setPage(1);
    },
    [toggleSort, setPage],
  );

  return {
    page,
    setPage,
    pageData,
    total,
    pageSize,
    setPageSize,
    totalPages,
    sortKey,
    sortDir,
    onSort,
  };
}

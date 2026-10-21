"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import {
  isColumnSortable,
  type SortDirection,
} from "@/features/admin/crud/sort-utils";
import { cn } from "@/lib/utils";

export interface AdminTableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  className?: string;
  sortable?: boolean;
}

interface AdminCrudTableProps {
  columns: AdminTableColumn[];
  children: React.ReactNode;
  className?: string;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return (
      <Icon
        name="swap_vert"
        size={16}
        className="text-fg-faint opacity-0 transition-opacity group-hover/th:opacity-100 group-focus-visible/th:opacity-100 [[data-sorted=true]_&]:opacity-100"
      />
    );
  }

  return (
    <Icon
      name={direction === "asc" ? "arrow_upward" : "arrow_downward"}
      size={16}
      className="text-brand"
    />
  );
}

export function AdminCrudTable({
  columns,
  children,
  className,
  sortKey,
  sortDirection = "asc",
  onSort,
}: AdminCrudTableProps) {
  const t = useTranslations("admin.crud");

  return (
    <table className={cn("w-full border-collapse text-left", className)}>
      <thead>
        <tr className="border-b border-line bg-subtle">
          {columns.map((col) => {
            const sortable = isColumnSortable(col.key, col.sortable);
            const active = sortable && sortKey === col.key;
            const alignClass =
              col.align === "right"
                ? "text-right"
                : col.align === "center"
                  ? "text-center"
                  : "text-left";

            if (!sortable || !onSort) {
              return (
                <th
                  key={col.key}
                  className={cn(
                    "px-6 py-3 text-xs font-medium uppercase tracking-wide text-fg-muted",
                    alignClass,
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              );
            }

            return (
              <th
                key={col.key}
                className={cn("px-6 py-3", alignClass, col.className)}
                aria-sort={
                  active
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <button
                  type="button"
                  data-sorted={active ? "true" : undefined}
                  onClick={() => onSort(col.key)}
                  className={cn(
                    "group/th inline-flex w-full items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted transition-colors hover:text-fg",
                    col.align === "right" && "justify-end",
                    col.align === "center" && "justify-center",
                    active && "text-fg",
                  )}
                  aria-label={
                    active
                      ? t("sortBy", {
                          column: col.label,
                          direction:
                            sortDirection === "asc"
                              ? t("sortAscending")
                              : t("sortDescending"),
                        })
                      : t("sortByColumn", { column: col.label })
                  }
                >
                  <span>{col.label}</span>
                  <SortIndicator active={active} direction={sortDirection} />
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">{children}</tbody>
    </table>
  );
}

export function AdminCrudTableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("group transition-colors hover:bg-subtle", className)}>
      {children}
    </tr>
  );
}

export function AdminCrudTableCell({
  children,
  align,
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-6 py-4 align-middle text-sm text-fg",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

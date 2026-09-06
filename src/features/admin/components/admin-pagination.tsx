"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { AdminSelect } from "@/features/admin/components/admin-field";
import { PAGE_SIZE_OPTIONS } from "@/features/admin/crud/use-client-pagination";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  const t = useTranslations("admin.table");
  const pageSizeId = useId();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-white/40 bg-white/25 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[#5f5e5e]">
          <label htmlFor={pageSizeId}>{t("show")}</label>
          <AdminSelect
            id={pageSizeId}
            size="sm"
            className="w-[5.25rem] shrink-0"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label={t("pageSize")}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </AdminSelect>
          <span>{t("entries")}</span>
        </div>
        <p className="text-xs font-medium text-[#5f5e5e]">
          {t("showing", { start, end, total })}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg p-1 text-[#5f5e5e] transition-colors hover:bg-white/50 disabled:opacity-50"
          aria-label={t("previous")}
        >
          <Icon name="chevron_left" size={20} />
        </button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="flex size-8 items-center justify-center text-[#5f5e5e]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                p === page
                  ? "admin-btn-primary"
                  : "text-[#1a1c1a] hover:bg-white/50",
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg p-1 text-[#1a1c1a] transition-colors hover:bg-white/50 disabled:opacity-50"
          aria-label={t("next")}
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>
    </div>
  );
}

function buildPageNumbers(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, "ellipsis", total];
  }
  if (current >= total - 2) {
    return [1, "ellipsis", total - 2, total - 1, total];
  }
  return [1, "ellipsis", current, "ellipsis", total];
}

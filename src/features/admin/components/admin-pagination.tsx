"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: AdminPaginationProps) {
  const t = useTranslations("admin.table");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between border-t border-white/40 bg-white/25 px-6 py-4">
      <p className="text-xs font-medium text-[#5f5e5e]">
        {t("showing", { start, end, total })}
      </p>
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

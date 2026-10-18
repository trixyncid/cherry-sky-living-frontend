"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import { cn } from "@/lib/utils";

export interface ToolbarFilter {
  key: string;
  label: string;
  /** The control (select, date range, segmented…). */
  control: ReactNode;
  /** Filter is applied → shows as a removable chip. */
  active: boolean;
  /** Chip text when active, e.g. "Cherry Kost". */
  chip?: string;
  onClear?: () => void;
  /** Desktop width class for the inline control. */
  width?: string;
}

/**
 * One search + filter pattern for every dashboard list:
 *   [ 🔍 search ··········· × ] [filter] [filter]        [view toggle]
 *   12 results · Cherry Kost × · Unpaid ×  Clear all
 * Phones get search + a "Filters" button (badge = active count) that opens a
 * bottom sheet with every filter, so content isn't pushed below the fold.
 */
export function AdminToolbar({
  search,
  filters = [],
  trailing,
  resultCount,
  className,
}: {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  filters?: ToolbarFilter[];
  /** Right-aligned controls that aren't filters (view toggles). */
  trailing?: ReactNode;
  resultCount?: number;
  className?: string;
}) {
  const t = useTranslations("admin.toolbar");
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const active = filters.filter((f) => f.active);
  const searching = Boolean(search?.value.trim());

  // "/" focuses search (desktop keyboard users), like most dashboards.
  useEffect(() => {
    if (!search) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search]);

  const clearAll = () => {
    for (const f of active) f.onClear?.();
    search?.onChange("");
  };

  return (
    <div className={cn("mb-5 space-y-3", className)}>
      <div className="flex flex-col gap-2.5 rounded-[1.5rem] border border-[#efe7e5] bg-white p-2.5 sm:p-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {search ? (
            <div className="relative min-w-0 flex-1">
              <Icon
                name="search"
                size={20}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c5653]"
              />
              <input
                ref={inputRef}
                type="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder}
                aria-label={search.placeholder}
                className="h-11 w-full rounded-xl border border-transparent bg-[#f6f1f0] pl-11 pr-20 text-base text-[#141414] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[#6b6b6b] hover:bg-[#f2ecea] focus:border-[#71130d] focus:bg-white focus:ring-[3px] focus:ring-[#71130d]/14 sm:text-[15px] [&::-webkit-search-cancel-button]:hidden"
              />
              {searching ? (
                <button
                  type="button"
                  onClick={() => {
                    search.onChange("");
                    inputRef.current?.focus();
                  }}
                  aria-label={t("clearSearch")}
                  className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#5c5653] hover:bg-[#ece4e2] hover:text-[#141414]"
                >
                  <Icon name="close" size={18} />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#e3d9d6] bg-white px-1.5 py-0.5 text-[11px] font-medium text-[#6b6b6b] lg:block">
                  /
                </kbd>
              )}
            </div>
          ) : null}

          {/* Phones / tablets: all filters live in a sheet */}
          {filters.length > 0 ? (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                "relative inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-[15px] font-medium transition-colors lg:hidden",
                active.length > 0
                  ? "bg-[#71130d] text-white"
                  : "border border-[#e3d9d6] bg-white text-[#141414]",
                !search && "flex-1 justify-center",
              )}
            >
              <Icon name="tune" size={20} />
              <span className={search ? "sr-only sm:not-sr-only" : undefined}>
                {t("filters")}
              </span>
              {active.length > 0 ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#71130d]">
                  {active.length}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>

        {/* Desktop: filters inline */}
        {filters.length > 0 ? (
          <div className="hidden items-center gap-2 lg:flex">
            {filters.map((f) => (
              <div key={f.key} className={cn("shrink-0", f.width ?? "w-48")}>
                {f.control}
              </div>
            ))}
          </div>
        ) : null}

        {trailing ? (
          <div className="flex shrink-0 items-center justify-between gap-2 lg:justify-end lg:border-l lg:border-[#f1ebea] lg:pl-3">
            {trailing}
          </div>
        ) : null}
      </div>

      {/* Summary: result count + active filters */}
      {resultCount !== undefined || active.length > 0 || searching ? (
        <div className="flex flex-wrap items-center gap-2 px-1 text-sm">
          {resultCount !== undefined ? (
            <span
              className="mr-1 font-medium text-[#141414]"
              aria-live="polite"
            >
              {t("results", { count: resultCount })}
            </span>
          ) : null}
          {searching ? (
            <Chip
              label={`“${search?.value.trim()}”`}
              onClear={() => search?.onChange("")}
              clearLabel={t("remove")}
            />
          ) : null}
          {active.map((f) => (
            <Chip
              key={f.key}
              label={f.chip ?? f.label}
              prefix={f.label}
              onClear={f.onClear}
              clearLabel={t("remove")}
            />
          ))}
          {active.length + (searching ? 1 : 0) > 1 ? (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full px-2.5 py-1 font-medium text-[#71130d] hover:bg-[#f3dedb]"
            >
              {t("clearAll")}
            </button>
          ) : null}
        </div>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88dvh] gap-0 overflow-y-auto rounded-t-[1.75rem] border-[#ece4e2] bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
        >
          <span
            className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#e6dedb]"
            aria-hidden
          />
          <SheetTitle className="text-xl font-medium tracking-tight text-[#141414]">
            {t("filters")}
          </SheetTitle>
          <SheetDescription className="mb-4 text-sm text-[#6b6b6b]">
            {t("sheetHint")}
          </SheetDescription>
          <div className="space-y-4">
            {filters.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#141414]">
                    {f.label}
                  </p>
                  {f.active && f.onClear ? (
                    <button
                      type="button"
                      onClick={f.onClear}
                      className="text-sm font-medium text-[#71130d]"
                    >
                      {t("reset")}
                    </button>
                  ) : null}
                </div>
                {f.control}
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            {active.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  for (const f of active) f.onClear?.();
                }}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-[#ece4e2] text-[15px] font-medium text-[#3d3a36]"
              >
                {t("clearAll")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="inline-flex h-12 flex-[2] items-center justify-center rounded-full bg-[#71130d] text-[15px] font-medium text-white"
            >
              {resultCount !== undefined
                ? t("showResults", { count: resultCount })
                : t("done")}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Chip({
  label,
  prefix,
  onClear,
  clearLabel,
}: {
  label: string;
  prefix?: string;
  onClear?: () => void;
  clearLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#e8bfb9] bg-[#fbf3f2] py-1 pl-3 pr-1 text-[#5c0f0a]">
      {prefix && prefix !== label ? (
        <span className="text-[#71130d]/70">{prefix}:</span>
      ) : null}
      <span className="max-w-48 truncate font-medium">{label}</span>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label={`${clearLabel} ${label}`}
          className="flex size-6 items-center justify-center rounded-full hover:bg-[#f3dedb]"
        >
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </span>
  );
}

/** The "Property" filter most lists share, as a ready ToolbarFilter. */
export function usePropertyToolbarFilter(
  value: string,
  onChange: (id: string) => void,
  options?: { allLabel?: string },
): ToolbarFilter {
  const t = useTranslations("admin.toolbar");
  const { properties } = useAdminShell();
  return {
    key: "property",
    label: t("property"),
    width: "w-52",
    active: value !== "",
    chip: properties.find((p) => p.id === value)?.name,
    onClear: () => onChange(""),
    control: (
      <PropertyFilter
        value={value}
        onChange={onChange}
        allLabel={options?.allLabel}
        className="w-full sm:w-full sm:max-w-none"
      />
    ),
  };
}

"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import {
  AdminDateRangePicker,
  AdminField,
} from "@/features/admin/components/admin-field";
import { cn } from "@/lib/utils";
import { formatDate } from "@/features/admin/lib/format";

export type AvailabilityRange = {
  startDate: string;
  endDate: string;
};

interface UnitsAvailabilityFilterProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  activeRange: AvailabilityRange | null;
  dateError: string | null;
  onApply: () => void;
  onClear: () => void;
  isFetching?: boolean;
  locale: string;
}

export function UnitsAvailabilityFilter({
  expanded,
  onToggleExpanded,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  activeRange,
  dateError,
  onApply,
  onClear,
  isFetching,
  locale,
}: UnitsAvailabilityFilterProps) {
  const tp = useTranslations("admin.pages.units.availability");

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleExpanded}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors",
            expanded || activeRange
              ? "border-[#8b5e3c]/35 bg-[#f5e4d4]/55 text-[#6f4627] backdrop-blur-md"
              : "glass-control text-[#51443c] hover:bg-white/80",
          )}
        >
          <Icon name="event_available" size={18} />
          {tp("toggle")}
        </button>

        {activeRange && (
          <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-sm text-emerald-800">
            <Icon name="check_circle" size={16} className="shrink-0" />
            <span className="truncate">
              {tp("active", {
                start: formatDate(activeRange.startDate, locale),
                end: formatDate(activeRange.endDate, locale),
              })}
            </span>
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 rounded-md p-0.5 text-emerald-700 transition-colors hover:bg-emerald-100"
              aria-label={tp("clear")}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="glass-panel rounded-2xl p-5">
          <p className="mb-1 text-sm font-medium text-[#51443c]">
            {tp("filters")}
          </p>
          <p className="mb-4 text-xs text-[#83746b]">{tp("hint")}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminField
              label={tp("dateRange")}
              htmlFor="units-avail-range"
              className="sm:col-span-2"
            >
              <AdminDateRangePicker
                id="units-avail-range"
                from={startDate}
                to={endDate}
                onFromChange={onStartDateChange}
                onToChange={onEndDateChange}
                placeholder={tp("dateRangePlaceholder")}
              />
            </AdminField>
            <div className="flex items-end gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={onApply}
                disabled={isFetching}
                className="admin-btn-primary flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
              >
                <Icon name="search" size={18} />
                {tp("search")}
              </button>
              {activeRange && (
                <button
                  type="button"
                  onClick={onClear}
                  className="glass-control flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-[#51443c] transition-colors hover:bg-white/80"
                >
                  {tp("clear")}
                </button>
              )}
            </div>
          </div>
          {dateError && (
            <p className="mt-3 text-sm text-[#ba1a1a]">{dateError}</p>
          )}
        </div>
      )}
    </div>
  );
}

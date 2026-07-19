"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { id as idLocale, enUS } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/features/admin/lib/format";
import { parseDateOnly, toDateOnlyString } from "@/lib/date-input";
import { cn } from "@/lib/utils";

const calendarLocaleMap = {
  en: enUS,
  id: idLocale,
} as const;

function rangeFromStrings(from: string, to: string): DateRange | undefined {
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  if (!fromDate && !toDate) return undefined;
  return { from: fromDate, to: toDate };
}

export type DateRangeValue = { from: string; to: string };

export interface DateRangePickerProps {
  from: string;
  to: string;
  /** Preferred: one update with both ends (avoids double setState). */
  onChange?: (range: DateRangeValue) => void;
  /** @deprecated Prefer `onChange` — kept for callers that update separately. */
  onFromChange?: (value: string) => void;
  /** @deprecated Prefer `onChange` — kept for callers that update separately. */
  onToChange?: (value: string) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  numberOfMonths?: number;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  onFromChange,
  onToChange,
  id,
  disabled,
  placeholder = "Pick a date range",
  className,
  numberOfMonths = 1,
}: DateRangePickerProps) {
  const appLocale = useLocale();
  const t = useTranslations("admin.dateRangePicker");
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(() =>
    rangeFromStrings(from, to),
  );
  const calendarLocale =
    calendarLocaleMap[appLocale as keyof typeof calendarLocaleMap] ?? enUS;

  useEffect(() => {
    if (open) {
      setRange(rangeFromStrings(from, to));
    }
  }, [open, from, to]);

  const label = useMemo(() => {
    const fromDate = parseDateOnly(from);
    const toDate = parseDateOnly(to);
    if (fromDate && toDate) {
      return `${formatDate(fromDate, appLocale)} – ${formatDate(toDate, appLocale)}`;
    }
    if (fromDate) return formatDate(fromDate, appLocale);
    return null;
  }, [from, to, appLocale]);

  const draftLabel = useMemo(() => {
    if (!range?.from) return null;
    const start = formatDate(range.from, appLocale);
    if (!range.to) return `${start} – …`;
    return `${start} – ${formatDate(range.to, appLocale)}`;
  }, [range, appLocale]);

  function emit(next: DateRangeValue) {
    onChange?.(next);
    onFromChange?.(next.from);
    onToChange?.(next.to);
  }

  function handleSelect(newRange: DateRange | undefined) {
    setRange(newRange);

    if (!newRange?.from) {
      emit({ from: "", to: "" });
      return;
    }

    emit({
      from: toDateOnlyString(newRange.from),
      to: newRange.to ? toDateOnlyString(newRange.to) : "",
    });
    // Keep open so the admin can adjust the range; close via Done.
  }

  function handleClear() {
    setRange(undefined);
    emit({ from: "", to: "" });
  }

  function handleDone() {
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-xl border border-[#d5c3b8] bg-[#faf9f6] px-3.5 text-left text-sm text-[#1a1c1a] transition-colors",
            "hover:border-[#c4b0a4] focus:border-[#8b5e3c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/15",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !label && "text-[#83746b]/70",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-[#6f4627]" />
          <span className="truncate">{label ?? placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden border-[#e8ddd4] bg-[#faf9f6] p-0 shadow-lg shadow-[#2f312f]/12"
        align="start"
      >
        <div className="border-b border-[#e8ddd4] px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-[#83746b]">
            {t("selected")}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[#1a1c1a]">
            {draftLabel ?? t("pickBoth")}
          </p>
        </div>
        <Calendar
          mode="range"
          locale={calendarLocale}
          numberOfMonths={numberOfMonths}
          resetOnSelect
          selected={range}
          onSelect={handleSelect}
          defaultMonth={range?.from ?? range?.to}
          className={cn(
            "rounded-none border-0 bg-transparent",
            numberOfMonths > 1 && "sm:min-w-[34rem]",
          )}
        />
        <div className="flex items-center justify-between gap-2 border-t border-[#e8ddd4] bg-white/70 px-3 py-2.5">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#51443c] transition-colors hover:bg-[#efe0d2] hover:text-[#6f4627]"
          >
            {t("clear")}
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-lg bg-[#6f4627] px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#805533]"
          >
            {t("done")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  /** Compact single-line trigger (default) or start/end panel. */
  variant?: "default" | "split";
  fromLabel?: string;
  toLabel?: string;
  fromHint?: string;
  toHint?: string;
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
  variant = "default",
  fromLabel,
  toLabel,
  fromHint,
  toHint,
}: DateRangePickerProps) {
  const appLocale = useLocale();
  const t = useTranslations("admin.dateRangePicker");
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(() =>
    rangeFromStrings(from, to),
  );
  const calendarLocale =
    calendarLocaleMap[appLocale as keyof typeof calendarLocaleMap] ?? enUS;

  const [month, setMonth] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (open) {
      const next = rangeFromStrings(from, to);
      setRange(next);
      setMonth(next?.from ?? next?.to ?? new Date());
    }
  }, [open, from, to]);

  const fromDate = useMemo(() => parseDateOnly(from), [from]);
  const toDate = useMemo(() => parseDateOnly(to), [to]);

  const label = useMemo(() => {
    if (fromDate && toDate) {
      return `${formatDate(fromDate, appLocale)} – ${formatDate(toDate, appLocale)}`;
    }
    if (fromDate) return formatDate(fromDate, appLocale);
    return null;
  }, [fromDate, toDate, appLocale]);

  const selectingEnd = Boolean(range?.from && !range?.to);
  const stepHint = !range?.from
    ? t("stepStart")
    : selectingEnd
      ? t("stepEnd")
      : t("stepAdjust");

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

  function handleToday() {
    const today = toDateOnlyString(new Date());
    setRange({ from: parseDateOnly(today), to: undefined });
    setMonth(new Date());
    emit({ from: today, to: "" });
  }

  /** One-tap ranges; the calendar jumps to the start month. */
  function applyPreset(preset: "thisMonth" | "lastMonth" | "last30" | "next30") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const y = today.getFullYear();
    const m = today.getMonth();
    const plus = (d: number) => {
      const x = new Date(today);
      x.setDate(x.getDate() + d);
      return x;
    };
    const [start, end] =
      preset === "thisMonth"
        ? [new Date(y, m, 1), new Date(y, m + 1, 0)]
        : preset === "lastMonth"
          ? [new Date(y, m - 1, 1), new Date(y, m, 0)]
          : preset === "last30"
            ? [plus(-29), today]
            : [today, plus(29)];
    setRange({ from: start, to: end });
    setMonth(start);
    emit({ from: toDateOnlyString(start), to: toDateOnlyString(end) });
  }

  function handleDone() {
    setOpen(false);
  }

  const resolvedFromLabel = fromLabel ?? t("start");
  const resolvedToLabel = toLabel ?? t("end");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "split" ? (
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={label ?? placeholder}
            className={cn(
              "group grid w-full grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-2xl border border-[#d9cfcb] bg-white text-left shadow-[0_1px_2px_rgb(28_11_10/0.05)] transition-[border-color,box-shadow]",
              "hover:border-[#b9a8a3]",
              "focus:outline-none focus-visible:border-[#71130d] focus-visible:ring-[3px] focus-visible:ring-[#71130d]/15",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#e8ddd4] disabled:hover:shadow-none",
              open && "border-[#71130d] ring-[3px] ring-[#71130d]/15",
              className,
            )}
          >
            <span className="flex min-w-0 flex-col gap-1 px-4 py-3.5 sm:px-5 sm:py-4">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                {resolvedFromLabel}
              </span>
              <span
                className={cn(
                  "truncate text-base font-semibold tracking-tight sm:text-lg",
                  fromDate ? "text-[#1a1c1a]" : "text-[#6b6b6b]",
                )}
              >
                {fromDate ? formatDate(fromDate, appLocale) : t("pickStart")}
              </span>
              {fromHint ? (
                <span className="truncate text-xs text-[#6b6b6b]">{fromHint}</span>
              ) : null}
            </span>

            <span
              aria-hidden
              className="flex items-center justify-center self-stretch border-x border-[#e8ddd4]/80 bg-white/40 px-2"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#71130d]/10 text-[#71130d] transition-colors group-hover:bg-[#71130d]/15">
                <CalendarIcon className="size-3.5" />
              </span>
            </span>

            <span className="flex min-w-0 flex-col gap-1 px-4 py-3.5 sm:px-5 sm:py-4">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                {resolvedToLabel}
              </span>
              <span
                className={cn(
                  "truncate text-base font-semibold tracking-tight sm:text-lg",
                  toDate ? "text-[#1a1c1a]" : "text-[#6b6b6b]",
                )}
              >
                {toDate ? formatDate(toDate, appLocale) : t("pickEnd")}
              </span>
              {toHint ? (
                <span className="truncate text-xs text-[#6b6b6b]">{toHint}</span>
              ) : null}
            </span>
          </button>
        ) : (
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              "glass-control flex h-11 w-full items-center gap-2 rounded-xl px-3.5 text-left text-base text-[#141414] transition-[border-color,box-shadow] sm:text-[15px]",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-60",
              !label && "text-[#6b6b6b]",
              className,
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-[#71130d]" />
            <span className="truncate">{label ?? placeholder}</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden rounded-[1.25rem] border border-[#e6dedb] bg-white p-0 shadow-[0_24px_60px_-24px_rgb(28_11_10/0.35)]"
        align="start"
      >
        <div className="space-y-3 border-b border-[#f1ebea] bg-white px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
              {t("selected")}
            </p>
            <p className="text-xs font-medium text-[#71130d]">{stepHint}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(
                "rounded-xl border px-3 py-2.5 transition-colors",
                range?.from && !selectingEnd
                  ? "border-[#71130d]/30 bg-white"
                  : selectingEnd
                    ? "border-[#e8ddd4] bg-white/70"
                    : "border-[#71130d]/35 bg-white shadow-sm",
              )}
            >
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#83746b]">
                {resolvedFromLabel}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-sm font-semibold",
                  range?.from ? "text-[#1a1c1a]" : "text-[#6b6b6b]",
                )}
              >
                {range?.from
                  ? formatDate(range.from, appLocale)
                  : t("pickStart")}
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl border px-3 py-2.5 transition-colors",
                selectingEnd
                  ? "border-[#71130d]/35 bg-white shadow-sm"
                  : range?.to
                    ? "border-[#71130d]/30 bg-white"
                    : "border-[#e8ddd4] bg-white/70",
              )}
            >
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#83746b]">
                {resolvedToLabel}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-sm font-semibold",
                  range?.to ? "text-[#1a1c1a]" : "text-[#6b6b6b]",
                )}
              >
                {range?.to ? formatDate(range.to, appLocale) : t("pickEnd")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto border-b border-[#f1ebea] px-3 py-2.5">
          {(["thisMonth", "lastMonth", "last30", "next30"] as const).map(
            (preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className="shrink-0 whitespace-nowrap rounded-full border border-[#e6dedb] bg-white px-3 py-1.5 text-sm text-[#3d3a36] transition-colors hover:border-[#c97f76] hover:text-[#71130d]"
              >
                {t(`presets.${preset}`)}
              </button>
            ),
          )}
        </div>
        <Calendar
          mode="range"
          locale={calendarLocale}
          numberOfMonths={numberOfMonths}
          resetOnSelect
          selected={range}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          className={cn(
            "mx-auto rounded-none border-0 bg-transparent",
            numberOfMonths > 1 && "sm:min-w-[34rem]",
          )}
        />
        <div className="flex items-center justify-between gap-2 border-t border-[#f1ebea] bg-white px-3 py-2.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[#3d3a36] transition-colors hover:bg-[#f6f0ef] hover:text-[#71130d]"
            >
              {t("clear")}
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[#3d3a36] transition-colors hover:bg-[#f6f0ef] hover:text-[#71130d]"
            >
              {t("today")}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-full bg-[#71130d] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#8a1a12]"
          >
            {t("done")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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

  useEffect(() => {
    if (open) {
      setRange(rangeFromStrings(from, to));
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
    emit({ from: today, to: "" });
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
              "group grid w-full grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-2xl border border-[#e8ddd4] bg-gradient-to-br from-white via-[#faf8f5] to-[#f3ebe3] text-left transition-all",
              "hover:border-[#d4c0b0] hover:shadow-[0_8px_24px_-16px_rgba(111,70,39,0.45)]",
              "focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/15",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#e8ddd4] disabled:hover:shadow-none",
              open && "border-[#c9a48a] ring-2 ring-[#8b5e3c]/15",
              className,
            )}
          >
            <span className="flex min-w-0 flex-col gap-1 px-4 py-3.5 sm:px-5 sm:py-4">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#83746b]">
                {resolvedFromLabel}
              </span>
              <span
                className={cn(
                  "truncate text-base font-semibold tracking-tight sm:text-lg",
                  fromDate ? "text-[#1a1c1a]" : "text-[#83746b]/70",
                )}
              >
                {fromDate ? formatDate(fromDate, appLocale) : t("pickStart")}
              </span>
              {fromHint ? (
                <span className="truncate text-xs text-[#83746b]">{fromHint}</span>
              ) : null}
            </span>

            <span
              aria-hidden
              className="flex items-center justify-center self-stretch border-x border-[#e8ddd4]/80 bg-white/40 px-2"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#6f4627]/10 text-[#6f4627] transition-colors group-hover:bg-[#6f4627]/15">
                <CalendarIcon className="size-3.5" />
              </span>
            </span>

            <span className="flex min-w-0 flex-col gap-1 px-4 py-3.5 sm:px-5 sm:py-4">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#83746b]">
                {resolvedToLabel}
              </span>
              <span
                className={cn(
                  "truncate text-base font-semibold tracking-tight sm:text-lg",
                  toDate ? "text-[#1a1c1a]" : "text-[#83746b]/70",
                )}
              >
                {toDate ? formatDate(toDate, appLocale) : t("pickEnd")}
              </span>
              {toHint ? (
                <span className="truncate text-xs text-[#83746b]">{toHint}</span>
              ) : null}
            </span>
          </button>
        ) : (
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              "glass-control flex h-10 w-full items-center gap-2 rounded-xl px-3.5 text-left text-sm text-[#1a1c1a] transition-all",
              "focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/15",
              "disabled:cursor-not-allowed disabled:opacity-50",
              open && "ring-2 ring-[#8b5e3c]/15",
              !label && "text-[#83746b]/70",
              className,
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-[#6f4627]" />
            <span className="truncate">{label ?? placeholder}</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden rounded-2xl border border-[#e8ddd4] bg-white p-0 shadow-[0_28px_56px_-28px_rgba(81,68,60,0.42)]"
        align="start"
      >
        <div className="space-y-3 border-b border-[#e8ddd4] bg-gradient-to-br from-[#faf8f5] via-white to-[#f3ebe3]/50 px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#83746b]">
              {t("selected")}
            </p>
            <p className="text-xs font-medium text-[#6f4627]">{stepHint}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(
                "rounded-xl border px-3 py-2.5 transition-colors",
                range?.from && !selectingEnd
                  ? "border-[#6f4627]/30 bg-white"
                  : selectingEnd
                    ? "border-[#e8ddd4] bg-white/70"
                    : "border-[#6f4627]/35 bg-white shadow-sm",
              )}
            >
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#83746b]">
                {resolvedFromLabel}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-sm font-semibold",
                  range?.from ? "text-[#1a1c1a]" : "text-[#83746b]/70",
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
                  ? "border-[#6f4627]/35 bg-white shadow-sm"
                  : range?.to
                    ? "border-[#6f4627]/30 bg-white"
                    : "border-[#e8ddd4] bg-white/70",
              )}
            >
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#83746b]">
                {resolvedToLabel}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-sm font-semibold",
                  range?.to ? "text-[#1a1c1a]" : "text-[#83746b]/70",
                )}
              >
                {range?.to ? formatDate(range.to, appLocale) : t("pickEnd")}
              </p>
            </div>
          </div>
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
        <div className="flex items-center justify-between gap-2 border-t border-[#e8ddd4] bg-[#faf9f6] px-3 py-2.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#51443c] transition-colors hover:bg-[#efe0d2] hover:text-[#6f4627]"
            >
              {t("clear")}
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#51443c] transition-colors hover:bg-[#efe0d2] hover:text-[#6f4627]"
            >
              {t("today")}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-xl bg-[#6f4627] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#805533]"
          >
            {t("done")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { enUS, id as idLocale } from "react-day-picker/locale";
import { PickerSurface } from "@/components/picker-surface";
import { Calendar } from "@/components/ui/calendar";
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
  function applyPreset(
    preset: "thisMonth" | "lastMonth" | "last30" | "next30",
  ) {
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

  const trigger =
    variant === "split" ? (
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={label ?? placeholder}
        className={cn(
          "group grid w-full grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-2xl border border-line-strong bg-white text-left shadow-[0_1px_2px_rgb(11_11_13/0.05)] transition-[border-color,box-shadow]",
          "hover:border-line-strong",
          "focus:outline-none focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/15",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:shadow-none",
          open && "border-brand ring-[3px] ring-brand/15",
          className,
        )}
      >
        <span className="flex min-w-0 flex-col gap-1 px-4 py-3.5 sm:px-5 sm:py-4">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-fg-muted">
            {resolvedFromLabel}
          </span>
          <span
            className={cn(
              "truncate text-base font-semibold tracking-tight sm:text-lg",
              fromDate ? "text-fg" : "text-fg-muted",
            )}
          >
            {fromDate ? formatDate(fromDate, appLocale) : t("pickStart")}
          </span>
          {fromHint ? (
            <span className="truncate text-xs text-fg-muted">{fromHint}</span>
          ) : null}
        </span>

        <span
          aria-hidden
          className="flex items-center justify-center self-stretch border-x border-line/80 bg-white/40 px-2"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors group-hover:bg-brand/15">
            <CalendarIcon className="size-3.5" />
          </span>
        </span>

        <span className="flex min-w-0 flex-col gap-1 px-4 py-3.5 sm:px-5 sm:py-4">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-fg-muted">
            {resolvedToLabel}
          </span>
          <span
            className={cn(
              "truncate text-base font-semibold tracking-tight sm:text-lg",
              toDate ? "text-fg" : "text-fg-muted",
            )}
          >
            {toDate ? formatDate(toDate, appLocale) : t("pickEnd")}
          </span>
          {toHint ? (
            <span className="truncate text-xs text-fg-muted">{toHint}</span>
          ) : null}
        </span>
      </button>
    ) : (
      <button
        id={id}
        type="button"
        disabled={disabled}
        className={cn(
          "glass-control flex h-11 w-full items-center gap-2 rounded-xl px-3.5 text-left text-base text-fg transition-[border-color,box-shadow] sm:text-[15px]",
          "focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
          !label && "text-fg-muted",
          className,
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-brand" />
        <span className="truncate">{label ?? placeholder}</span>
      </button>
    );

  return (
    <PickerSurface
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={label ?? placeholder}
    >
      {(isPhone) => (
        <>
          <div className="space-y-3 border-b border-line bg-white px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                {t("selected")}
              </p>
              <p className="text-xs font-medium text-brand">{stepHint}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={cn(
                  "rounded-xl border px-3 py-2.5 transition-colors",
                  range?.from && !selectingEnd
                    ? "border-brand/30 bg-white"
                    : selectingEnd
                      ? "border-line bg-white/70"
                      : "border-brand/35 bg-white shadow-sm",
                )}
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  {resolvedFromLabel}
                </p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-sm font-semibold",
                    range?.from ? "text-fg" : "text-fg-muted",
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
                    ? "border-brand/35 bg-white shadow-sm"
                    : range?.to
                      ? "border-brand/30 bg-white"
                      : "border-line bg-white/70",
                )}
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  {resolvedToLabel}
                </p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-sm font-semibold",
                    range?.to ? "text-fg" : "text-fg-muted",
                  )}
                >
                  {range?.to ? formatDate(range.to, appLocale) : t("pickEnd")}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2.5">
            {(["thisMonth", "lastMonth", "last30", "next30"] as const).map(
              (preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="shrink-0 whitespace-nowrap rounded-full border border-line bg-white px-3 py-1.5 text-sm text-fg-2 transition-colors hover:border-brand-line hover:text-brand"
                >
                  {t(`presets.${preset}`)}
                </button>
              ),
            )}
          </div>
          <Calendar
            mode="range"
            locale={calendarLocale}
            numberOfMonths={isPhone ? 1 : numberOfMonths}
            resetOnSelect
            selected={range}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            className={cn(
              "mx-auto rounded-none border-0 bg-transparent",
              !isPhone && numberOfMonths > 1 && "sm:min-w-[34rem]",
            )}
          />
          <div
            className={cn(
              "flex items-center justify-between gap-2 border-t border-line bg-white px-3 py-2.5",
              isPhone && "sticky bottom-0 px-4 py-3",
            )}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-fg-2 transition-colors hover:bg-hover hover:text-brand"
              >
                {t("clear")}
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-fg-2 transition-colors hover:bg-hover hover:text-brand"
              >
                {t("today")}
              </button>
            </div>
            <button
              type="button"
              onClick={handleDone}
              className={cn(
                "rounded-full bg-brand px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-hover",
                isPhone && "h-11 px-7",
              )}
            >
              {t("done")}
            </button>
          </div>
        </>
      )}
    </PickerSurface>
  );
}

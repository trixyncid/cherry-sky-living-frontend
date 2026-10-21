"use client";

import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
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

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  popoverClassName?: string;
  fromDate?: Date;
  toDate?: Date;
  /** Extra per-day disable rules (combined with fromDate/toDate). */
  isDateDisabled?: (date: Date) => boolean;
}

export function DatePicker({
  value,
  onChange,
  id,
  disabled,
  placeholder = "Pick a date",
  className,
  popoverClassName,
  fromDate,
  toDate,
  isDateDisabled,
}: DatePickerProps) {
  const appLocale = useLocale();
  const t = useTranslations("admin.datePicker");
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseDateOnly(value), [value]);
  const calendarLocale =
    calendarLocaleMap[appLocale as keyof typeof calendarLocaleMap] ?? enUS;

  function handleToday() {
    const today = new Date();
    if (fromDate && today < fromDate) return;
    if (toDate && today > toDate) return;
    if (isDateDisabled?.(today)) return;
    onChange(toDateOnlyString(today));
    setOpen(false);
  }

  function handleClear() {
    onChange("");
  }

  const trigger = (
    <button
      id={id}
      type="button"
      disabled={disabled}
      className={cn(
        "group flex h-11 w-full items-center gap-3 rounded-xl border border-line-strong bg-white px-3.5 text-left text-base text-fg shadow-[0_1px_2px_rgb(11_11_13/0.05)] transition-[border-color,box-shadow] sm:text-[15px]",
        "hover:border-line-strong",
        "focus:outline-none focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/15",
        "disabled:cursor-not-allowed disabled:bg-hover disabled:opacity-60 disabled:hover:border-line-strong",
        open && "border-brand ring-[3px] ring-brand/15",
        !value && "text-fg-muted",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors group-hover:bg-brand/15">
        <CalendarIcon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">
        {selected ? formatDate(selected, appLocale) : placeholder}
      </span>
    </button>
  );

  return (
    <PickerSurface
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={t("pickDate")}
      popoverClassName={popoverClassName}
    >
      {(isPhone) => (
        <>
          <div className="border-b border-line bg-white px-4 py-3.5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-fg-muted">
              {t("selected")}
            </p>
            <p className="mt-1 text-sm font-semibold text-fg">
              {selected ? formatDate(selected, appLocale) : t("pickDate")}
            </p>
          </div>
          <Calendar
            mode="single"
            locale={calendarLocale}
            selected={selected}
            onSelect={(date) => {
              onChange(date ? toDateOnlyString(date) : "");
              setOpen(false);
            }}
            disabled={(date) => {
              if (fromDate && date < fromDate) return true;
              if (toDate && date > toDate) return true;
              if (isDateDisabled?.(date)) return true;
              return false;
            }}
            defaultMonth={selected}
            className="mx-auto rounded-none border-0 bg-transparent"
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
              onClick={() => setOpen(false)}
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

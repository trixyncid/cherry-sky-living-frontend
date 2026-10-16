"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "group flex h-11 w-full items-center gap-3 rounded-xl border border-[#d9cfcb] bg-white px-3.5 text-left text-base text-[#141414] shadow-[0_1px_2px_rgb(28_11_10/0.05)] transition-[border-color,box-shadow] sm:text-[15px]",
            "hover:border-[#b9a8a3]",
            "focus:outline-none focus-visible:border-[#71130d] focus-visible:ring-[3px] focus-visible:ring-[#71130d]/15",
            "disabled:cursor-not-allowed disabled:bg-[#f3efee] disabled:opacity-60 disabled:hover:border-[#d9cfcb]",
            open && "border-[#71130d] ring-[3px] ring-[#71130d]/15",
            !value && "text-[#6b6b6b]",
            className,
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#71130d]/10 text-[#71130d] transition-colors group-hover:bg-[#71130d]/15">
            <CalendarIcon className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {selected ? formatDate(selected, appLocale) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-auto overflow-hidden rounded-[1.25rem] border border-[#e6dedb] bg-white p-0 shadow-[0_24px_60px_-24px_rgb(28_11_10/0.35)]",
          popoverClassName,
        )}
        align="start"
      >
        <div className="border-b border-[#f1ebea] bg-white px-4 py-3.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
            {t("selected")}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#1a1c1a]">
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
          className="rounded-none border-0 bg-transparent"
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
            onClick={() => setOpen(false)}
            className="rounded-full bg-[#71130d] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#8a1a12]"
          >
            {t("done")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
            "group flex h-11 w-full items-center gap-3 rounded-2xl border border-[#e8ddd4] bg-gradient-to-br from-white via-[#faf8f5] to-[#f3ebe3] px-3.5 text-left text-sm text-[#1a1c1a] transition-all",
            "hover:border-[#d4c0b0] hover:shadow-[0_8px_24px_-16px_rgba(111,70,39,0.45)]",
            "focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/15",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#e8ddd4] disabled:hover:shadow-none",
            open && "border-[#c9a48a] ring-2 ring-[#8b5e3c]/15",
            !value && "text-[#83746b]/70",
            className,
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#6f4627]/10 text-[#6f4627] transition-colors group-hover:bg-[#6f4627]/15">
            <CalendarIcon className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {selected ? formatDate(selected, appLocale) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-auto overflow-hidden rounded-2xl border border-[#e8ddd4] bg-white p-0 shadow-[0_28px_56px_-28px_rgba(81,68,60,0.42)]",
          popoverClassName,
        )}
        align="start"
      >
        <div className="border-b border-[#e8ddd4] bg-gradient-to-br from-[#faf8f5] via-white to-[#f3ebe3]/50 px-4 py-3.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#83746b]">
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
            return false;
          }}
          defaultMonth={selected}
          className="rounded-none border-0 bg-transparent"
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
            onClick={() => setOpen(false)}
            className="rounded-xl bg-[#6f4627] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#805533]"
          >
            {t("done")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

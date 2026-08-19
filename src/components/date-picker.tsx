"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
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
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseDateOnly(value), [value]);
  const calendarLocale =
    calendarLocaleMap[appLocale as keyof typeof calendarLocaleMap] ?? enUS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "glass-control flex h-10 w-full items-center gap-2 rounded-xl px-3.5 text-left text-sm transition-all",
            "focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/15",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-[#83746b]/70",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-[#6f4627]/80" />
          <span className="truncate">
            {selected ? formatDate(selected, appLocale) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", popoverClassName)} align="start">
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
        />
      </PopoverContent>
    </Popover>
  );
}

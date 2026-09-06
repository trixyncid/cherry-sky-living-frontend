"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";

/** Inline so these beat react-day-picker/style.css (imported after Tailwind). */
const cherryRdpVars = {
  "--rdp-accent-color": "#6f4627",
  "--rdp-accent-background-color": "#efe0d2",
  "--rdp-today-color": "#6f4627",
  "--rdp-day-height": "2.375rem",
  "--rdp-day-width": "2.375rem",
  "--rdp-day_button-height": "2.125rem",
  "--rdp-day_button-width": "2.125rem",
  "--rdp-day_button-border-radius": "9999px",
  "--rdp-day_button-border": "2px solid transparent",
  "--rdp-selected-border": "2px solid transparent",
  "--rdp-range_middle-background-color": "#f3ebe3",
  "--rdp-range_middle-color": "#51443c",
  "--rdp-range_start-color": "#ffffff",
  "--rdp-range_end-color": "#ffffff",
  "--rdp-range_start-date-background-color": "#6f4627",
  "--rdp-range_end-date-background-color": "#6f4627",
  "--rdp-range_start-background":
    "linear-gradient(var(--rdp-gradient-direction), transparent 50%, #f3ebe3 50%)",
  "--rdp-range_end-background":
    "linear-gradient(var(--rdp-gradient-direction), #f3ebe3 50%, transparent 50%)",
  "--rdp-nav_button-height": "2rem",
  "--rdp-nav_button-width": "2rem",
  "--rdp-nav-height": "2.75rem",
  "--rdp-months-gap": "1.5rem",
} as React.CSSProperties;

/**
 * DayPicker renders a real <table> for the month grid — do not force flex on
 * week/weekday rows or columns collapse.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  style,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      {...props}
      style={{ ...cherryRdpVars, ...style }}
      className={cn(
        "rdp-cherry bg-transparent p-3.5 text-[#1a1c1a] sm:p-4",
        "[&_.rdp-selected]:text-sm [&_.rdp-selected]:font-semibold",
        "[&_.rdp-selected_.rdp-day_button]:border-transparent",
        "[&_.rdp-range_middle_.rdp-day_button]:rounded-none [&_.rdp-range_middle_.rdp-day_button]:bg-transparent",
        className,
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-5 sm:flex-row sm:gap-6",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col gap-3", defaultClassNames.month),
        month_caption: cn(
          "relative flex h-11 items-center justify-center rounded-xl bg-[#faf6f1] px-11",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "text-sm font-semibold tracking-tight text-[#1a1c1a]",
          defaultClassNames.caption_label,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex h-11 w-full items-center justify-between px-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "inline-flex size-8 items-center justify-center rounded-full text-[#6f4627] transition-colors hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e3c]/25",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "inline-flex size-8 items-center justify-center rounded-full text-[#6f4627] transition-colors hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e3c]/25",
          defaultClassNames.button_next,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: defaultClassNames.weekdays,
        weekday: cn(
          "h-9 w-9 select-none text-center text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#83746b]",
          defaultClassNames.weekday,
        ),
        week: defaultClassNames.week,
        day: cn(
          "relative p-0.5 text-center align-middle",
          defaultClassNames.day,
        ),
        day_button: cn(
          "inline-flex size-[2.125rem] items-center justify-center rounded-full text-sm text-[#1a1c1a] transition-colors",
          "hover:bg-[#efe0d2] hover:text-[#6f4627]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e3c]/25",
          defaultClassNames.day_button,
        ),
        selected: defaultClassNames.selected,
        today: cn(
          "font-semibold text-[#6f4627] [&_.rdp-day_button]:bg-[#efe0d2]/55 [&_.rdp-day_button]:ring-1 [&_.rdp-day_button]:ring-[#6f4627]/25",
          defaultClassNames.today,
        ),
        outside: cn("text-[#a89b92] opacity-45", defaultClassNames.outside),
        disabled: cn(
          "text-[#c4b8b0] opacity-35",
          defaultClassNames.disabled,
        ),
        range_start: defaultClassNames.range_start,
        range_middle: defaultClassNames.range_middle,
        range_end: defaultClassNames.range_end,
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return (
            <Icon
              className={cn("size-4 stroke-[2] text-[#6f4627]", chevronClassName)}
              aria-hidden
            />
          );
        },
      }}
    />
  );
}

export { Calendar };

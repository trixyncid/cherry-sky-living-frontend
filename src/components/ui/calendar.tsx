"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";

/** Inline so these beat react-day-picker/style.css (imported after Tailwind). */
const cherryRdpVars = {
  "--rdp-accent-color": "#71130d",
  "--rdp-accent-background-color": "#f3dedb",
  "--rdp-today-color": "#71130d",
  "--rdp-day-height": "2.75rem",
  "--rdp-day-width": "2.75rem",
  "--rdp-day_button-height": "2.5rem",
  "--rdp-day_button-width": "2.5rem",
  "--rdp-day_button-border-radius": "9999px",
  "--rdp-day_button-border": "2px solid transparent",
  "--rdp-selected-border": "2px solid transparent",
  "--rdp-range_middle-background-color": "#f3dedb",
  "--rdp-range_middle-color": "#5c0f0a",
  "--rdp-range_start-color": "#ffffff",
  "--rdp-range_end-color": "#ffffff",
  "--rdp-range_start-date-background-color": "#71130d",
  "--rdp-range_end-date-background-color": "#71130d",
  "--rdp-range_start-background":
    "linear-gradient(var(--rdp-gradient-direction), transparent 50%, #f3dedb 50%)",
  "--rdp-range_end-background":
    "linear-gradient(var(--rdp-gradient-direction), #f3dedb 50%, transparent 50%)",
  "--rdp-nav_button-height": "2.25rem",
  "--rdp-nav_button-width": "2.25rem",
  "--rdp-nav-height": "2.75rem",
  "--rdp-months-gap": "2rem",
} as React.CSSProperties;

const navButton =
  // Trailing ! beats react-day-picker/style.css, which loads after Tailwind.
  "inline-flex size-9! items-center justify-center rounded-full! border! border-solid! border-[#e6dedb]! bg-white! text-[#71130d] transition-colors hover:border-[#c97f76]! hover:bg-[#fbf3f2]! focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#71130d]/20 disabled:opacity-35";

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
        "rdp-cherry bg-transparent p-3 text-[#141414] sm:p-4",
        "[&_.rdp-range_start]:font-semibold [&_.rdp-range_end]:font-semibold [&_.rdp-selected:not(.rdp-range_middle)]:font-semibold",
        "[&_.rdp-selected_.rdp-day_button]:border-transparent",
        "[&_.rdp-range_middle_.rdp-day_button]:rounded-none [&_.rdp-range_middle_.rdp-day_button]:bg-transparent [&_.rdp-range_middle_.rdp-day_button]:font-medium",
        className,
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-6 sm:flex-row sm:gap-8",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col gap-2", defaultClassNames.month),
        month_caption: cn(
          "relative flex h-11 items-center justify-center px-12",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "text-base font-medium tracking-tight text-[#141414] capitalize",
          defaultClassNames.caption_label,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex h-11 w-full items-center justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(navButton, defaultClassNames.button_previous),
        button_next: cn(navButton, defaultClassNames.button_next),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: defaultClassNames.weekdays,
        weekday: cn(
          "h-9 w-11 select-none text-center text-xs font-medium text-[#6b6b6b]",
          defaultClassNames.weekday,
        ),
        week: defaultClassNames.week,
        day: cn(
          "relative p-0.5 text-center align-middle",
          defaultClassNames.day,
        ),
        day_button: cn(
          "relative inline-flex size-10 items-center justify-center rounded-full text-[15px] tabular-nums text-[#141414] transition-colors",
          "hover:bg-[#f6f0ef]",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#71130d]/25",
          defaultClassNames.day_button,
        ),
        selected: cn(
          "[&_.rdp-day_button]:shadow-[0_6px_14px_-6px_rgb(113_19_13/0.6)]",
          defaultClassNames.selected,
        ),
        today: cn("font-semibold text-[#71130d]", defaultClassNames.today),
        outside: cn("text-[#a9a09b]", defaultClassNames.outside),
        disabled: cn(
          "cursor-not-allowed text-[#c9bfbb] [&_.rdp-day_button]:cursor-not-allowed [&_.rdp-day_button]:hover:bg-transparent",
          defaultClassNames.disabled,
        ),
        range_start: defaultClassNames.range_start,
        range_middle: cn(
          "font-normal [&_.rdp-day_button]:font-normal",
          defaultClassNames.range_middle,
        ),
        range_end: defaultClassNames.range_end,
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return (
            <Icon
              className={cn(
                "size-[18px] stroke-[2] text-[#71130d]",
                chevronClassName,
              )}
              aria-hidden
            />
          );
        },
      }}
    />
  );
}

export { Calendar };

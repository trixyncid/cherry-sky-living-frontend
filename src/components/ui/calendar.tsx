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
  "--rdp-day-height": "2.25rem",
  "--rdp-day-width": "2.25rem",
  "--rdp-day_button-height": "2.25rem",
  "--rdp-day_button-width": "2.25rem",
  "--rdp-day_button-border-radius": "0.5rem",
  "--rdp-day_button-border": "2px solid transparent",
  "--rdp-selected-border": "2px solid transparent",
  "--rdp-range_middle-background-color": "#efe0d2",
  "--rdp-range_middle-color": "#51443c",
  "--rdp-range_start-color": "#ffffff",
  "--rdp-range_end-color": "#ffffff",
  "--rdp-range_start-date-background-color": "#6f4627",
  "--rdp-range_end-date-background-color": "#6f4627",
  "--rdp-range_start-background":
    "linear-gradient(var(--rdp-gradient-direction), transparent 50%, #efe0d2 50%)",
  "--rdp-range_end-background":
    "linear-gradient(var(--rdp-gradient-direction), #efe0d2 50%, transparent 50%)",
  "--rdp-nav_button-height": "2rem",
  "--rdp-nav_button-width": "2rem",
  "--rdp-nav-height": "2.5rem",
  "--rdp-months-gap": "1.25rem",
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
        "rdp-cherry bg-white p-3 text-[#1a1c1a]",
        "[&_.rdp-selected]:text-sm [&_.rdp-selected]:font-medium",
        "[&_.rdp-selected_.rdp-day_button]:border-transparent",
        className,
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 sm:flex-row sm:gap-5",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col gap-2", defaultClassNames.month),
        month_caption: cn(
          "relative flex h-10 items-center justify-center px-9",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "text-sm font-semibold tracking-tight text-[#1a1c1a]",
          defaultClassNames.caption_label,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex h-10 w-full items-center justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-[#6f4627] transition-colors hover:bg-[#efe0d2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e3c]/25",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-[#6f4627] transition-colors hover:bg-[#efe0d2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e3c]/25",
          defaultClassNames.button_next,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: defaultClassNames.weekdays,
        weekday: cn(
          "h-8 w-9 select-none text-center text-[0.65rem] font-medium uppercase tracking-wider text-[#83746b]",
          defaultClassNames.weekday,
        ),
        week: defaultClassNames.week,
        day: cn("relative p-0 text-center align-middle", defaultClassNames.day),
        day_button: cn(
          "inline-flex size-9 items-center justify-center rounded-lg text-sm text-[#1a1c1a] transition-colors",
          "hover:bg-[#efe0d2] hover:text-[#6f4627]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e3c]/25",
          defaultClassNames.day_button,
        ),
        selected: defaultClassNames.selected,
        today: cn(
          "font-semibold text-[#6f4627] [&_.rdp-day_button]:ring-1 [&_.rdp-day_button]:ring-[#6f4627]/30",
          defaultClassNames.today,
        ),
        outside: cn("text-[#a89b92] opacity-50", defaultClassNames.outside),
        disabled: cn(
          "text-[#c4b8b0] opacity-40",
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

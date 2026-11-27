/**
 * Custom dropdown for the landing page (replaces native <select>): a flat
 * field cell and a floating option list in the page's own style. Built on
 * Radix Select, so it keeps full keyboard support (arrows, type-ahead,
 * Home/End, Esc), focus management and screen-reader semantics.
 */

"use client";

import { Select } from "radix-ui";
import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

/** Radix reserves "" for "no value"; this stands in for an empty option. */
const EMPTY = "__any__";
const toRadix = (v: string) => (v === "" ? EMPTY : v);
const fromRadix = (v: string) => (v === EMPTY ? "" : v);

export function Dropdown({
  id,
  label,
  value,
  onChange,
  options,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <div className={cn("bg-ink-2 px-4 pb-1.5 pt-3.5", className)}>
      <span
        id={`${id}-label`}
        className="eyebrow block text-left text-[10px] text-white/55"
      >
        {label}
      </span>
      <Select.Root
        value={toRadix(value)}
        onValueChange={(v) => onChange(fromRadix(v))}
      >
        <Select.Trigger
          id={id}
          aria-labelledby={`${id}-label ${id}`}
          className="group flex h-10 w-full items-center justify-between gap-2 rounded-md text-left text-[15px] font-medium text-white transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="truncate">
            <Select.Value>{current?.label}</Select.Value>
          </span>
          <Select.Icon asChild>
            <Icon
              name="expand_more"
              size={18}
              className="shrink-0 text-white/70 transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={8}
            align="start"
            // Lenis must not hijack wheel scrolling inside the list.
            data-lenis-prevent
            className="z-[60] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[max(12rem,var(--radix-select-trigger-width))] overflow-hidden rounded-lg border border-white/15 bg-ink-2 p-1 text-white shadow-[0_24px_60px_-20px_rgb(22_16_38/0.8)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          >
            <Select.Viewport className="max-h-[inherit] overflow-y-auto">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={toRadix(option.value)}
                  className="flex cursor-pointer select-none items-center justify-between gap-3 rounded-md px-3 py-2.5 text-[15px] text-white/80 outline-none transition-colors data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[state=checked]:font-semibold data-[state=checked]:text-white"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Icon
                      name="check"
                      size={16}
                      className="text-brand-bright"
                    />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

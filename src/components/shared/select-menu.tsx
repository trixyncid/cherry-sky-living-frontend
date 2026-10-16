"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SelectMenuOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectMenuProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  "aria-label"?: string;
};

export function SelectMenu({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  className,
  contentClassName,
  "aria-label": ariaLabel,
}: SelectMenuProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldScrollActiveIntoView = useRef(false);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const selectedLabel = selected?.label ?? "";
  const isPlaceholder = !selected;

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((option) => option.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [open, options, value]);

  useEffect(() => {
    if (!open || !shouldScrollActiveIntoView.current) return;
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    shouldScrollActiveIntoView.current = false;
  }, [activeIndex, open]);

  function handleSelect(next: string) {
    onChange(next);
    setOpen(false);
  }

  function moveActiveIndex(nextIndex: number) {
    shouldScrollActiveIntoView.current = true;
    setActiveIndex(nextIndex);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (event.key === "ArrowDown") {
        moveActiveIndex(
          Math.min(activeIndex + 1, Math.max(options.length - 1, 0)),
        );
      } else {
        moveActiveIndex(Math.max(activeIndex - 1, 0));
      }
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      moveActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      moveActiveIndex(Math.max(options.length - 1, 0));
      return;
    }

    if (
      event.key === "Enter" &&
      open &&
      options[activeIndex] &&
      !options[activeIndex].disabled
    ) {
      event.preventDefault();
      handleSelect(options[activeIndex].value);
    }
  }

  const triggerClassName = cn(
    "relative flex h-[3.25rem] w-full items-center rounded-xl border border-[#cfc5c1] bg-white px-4 pr-10 text-left text-base text-[#141414] transition-colors",
    "hover:border-[#b9a8a3] focus:border-[#71130d] focus:outline-none focus:ring-[3px] focus:ring-[#71130d]/15",
    "disabled:cursor-not-allowed disabled:bg-[#f5f3f0] disabled:text-[#83746b] disabled:hover:border-[#e3e2e0]",
    open && "border-[#71130d] ring-[3px] ring-[#71130d]/15",
    isPlaceholder && "text-[#6b6b6b]",
    className,
  );

  if (disabled) {
    return (
      <div className="relative min-w-0">
        <div className={cn(triggerClassName, "opacity-70")}>
          <span className="truncate">{selectedLabel || placeholder}</span>
        </div>
        <span
          className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-[#83746b]"
          aria-hidden
        >
          <Icon name="expand_more" size={20} />
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <Popover modal={false} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-controls={listboxId}
            disabled={disabled}
            onKeyDown={handleTriggerKeyDown}
            className={triggerClassName}
          >
            <span className="min-w-0 flex-1 truncate pr-2">
              {selectedLabel || placeholder}
            </span>
            <span
              className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-[#83746b]"
              aria-hidden
            >
              <Icon
                name="expand_more"
                size={20}
                className={cn("transition-transform", open && "rotate-180")}
              />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "z-[90] w-[var(--radix-popover-trigger-width)] min-w-[12rem] overflow-hidden rounded-xl border border-[#e3e2e0] bg-white p-0 shadow-[0_18px_40px_-24px_rgba(81,68,60,0.45)]",
            contentClassName,
          )}
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <ul
            id={listboxId}
            role="listbox"
            className="max-h-56 overscroll-contain overflow-y-auto p-1.5"
            onWheel={(event) => event.stopPropagation()}
          >
            {options.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-[#83746b]">
                {placeholder}
              </li>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <li key={`${option.value}-${index}`} role="presentation">
                    <button
                      ref={(node) => {
                        itemRefs.current[index] = node;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        isActive && "bg-[#f5ebe3]",
                        isSelected
                          ? "font-semibold text-[#71130d]"
                          : "text-[#1a1c1a]",
                        option.disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      {isSelected ? (
                        <Icon
                          name="check"
                          size={18}
                          className="shrink-0 text-[#71130d]"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

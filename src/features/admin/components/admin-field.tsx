"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { RequiredMark } from "@/components/shared/required-mark";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { adminMenuItemClassName } from "@/features/admin/components/admin-menu";
import { formatIdrInput } from "@/features/admin/lib/format";
import { cn } from "@/lib/utils";

export function AdminField({
  label,
  htmlFor,
  children,
  className,
  required,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-label-sm text-foreground"
        aria-required={required || undefined}
      >
        {label}
        {required ? <RequiredMark className="ml-0.5" /> : null}
      </label>
      {children}
    </div>
  );
}

// 16px on phones so iOS Safari doesn't zoom on focus; 15px from sm up.
const adminControlBase =
  "glass-control w-full rounded-xl text-base text-fg transition-[border-color,box-shadow] focus:outline-none sm:text-[15px]";

/** Readable placeholder (≈5.3:1 on white). */
const placeholderTone = "placeholder:text-fg-muted";

export const adminInputClassName = cn(
  adminControlBase,
  "h-11 px-3.5",
  placeholderTone,
);

export const adminSelectClassName = cn(
  adminControlBase,
  "h-11 cursor-pointer appearance-none pl-3.5 pr-10",
);

export const adminSearchInputClassName = cn(
  adminControlBase,
  "h-11 pl-10 pr-4",
  placeholderTone,
);

export const adminMenuSearchClassName = cn(
  "h-11 w-full rounded-lg border border-line-strong bg-white pl-10 pr-4 text-base text-fg sm:text-[15px]",
  "placeholder:text-fg-muted outline-none",
  "focus:border-brand focus:ring-[3px] focus:ring-brand/15",
);

export const adminTextareaClassName = cn(
  adminControlBase,
  "min-h-[8.5rem] resize-y px-3.5 py-3 leading-relaxed",
  placeholderTone,
);

export const AdminTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & { textareaClassName?: string }
>(function AdminTextarea(
  { className, textareaClassName, rows = 5, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(adminTextareaClassName, textareaClassName, className)}
      {...props}
    />
  );
});

export function AdminFileInput({
  id,
  accept = "image/*",
  file,
  onFileChange,
  multiple = false,
  onFilesChange,
  selectedCount = 0,
  className,
  disabled,
}: {
  id?: string;
  accept?: string;
  file?: File | null;
  onFileChange?: (file: File | null) => void;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  selectedCount?: number;
  className?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("admin.crud");
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (multiple) {
      onFilesChange?.(files);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    onFileChange?.(files[0] ?? null);
  }

  function handleClear() {
    onFileChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const label = multiple
    ? selectedCount > 0
      ? t("filesChosen", { count: selectedCount })
      : t("noFileChosen")
    : (file?.name ?? t("noFileChosen"));

  return (
    <div
      className={cn(
        "glass-control flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
        disabled && "opacity-50",
        className,
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="shrink-0 rounded-lg border border-white/60 bg-white/70 px-3 py-1.5 text-sm font-semibold text-fg-2 transition-colors hover:bg-white disabled:cursor-not-allowed"
      >
        {t("chooseFile")}
      </button>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          (multiple ? selectedCount > 0 : !!file)
            ? "font-medium text-fg"
            : "text-fg-muted",
        )}
      >
        {label}
      </span>
      {!multiple && file ? (
        <button
          type="button"
          disabled={disabled}
          onClick={handleClear}
          className="shrink-0 rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-hover hover:text-fg-2 disabled:cursor-not-allowed"
          aria-label={t("clearFile")}
        >
          <Icon name="close" size={18} />
        </button>
      ) : null}
    </div>
  );
}

export function AdminSelect({
  className,
  selectClassName,
  contentClassName,
  size = "default",
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  id,
  name,
  "aria-label": ariaLabel,
}: Omit<React.ComponentProps<"select">, "size"> & {
  className?: string;
  selectClassName?: string;
  contentClassName?: string;
  size?: "default" | "sm";
}) {
  const listboxId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const typeaheadRef = React.useRef("");
  const typeaheadTimer = React.useRef<number>(0);
  const isSm = size === "sm";
  const chevronSize = isSm ? 16 : 20;
  const checkSize = isSm ? 16 : 18;

  const options = React.useMemo(
    () => optionsFromChildren(children),
    [children],
  );

  const selectedValue = String(value ?? defaultValue ?? "");
  const selected = options.find((option) => option.value === selectedValue);
  const selectedLabel = selected?.label ?? "";
  const isPlaceholder = !selected;

  React.useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((option) => option.value === selectedValue);
    setActiveIndex(idx >= 0 ? idx : 0);
    // Only reset highlight when the menu opens, not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  React.useEffect(
    () => () => window.clearTimeout(typeaheadTimer.current),
    [],
  );

  function emitChange(next: string) {
    onChange?.({
      target: { value: next, name: name ?? "", id: id ?? "" },
      currentTarget: { value: next, name: name ?? "", id: id ?? "" },
    } as React.ChangeEvent<HTMLSelectElement>);
  }

  function handleSelect(next: string) {
    emitChange(next);
    setOpen(false);
  }

  function handleTypeahead(key: string) {
    typeaheadRef.current += key.toLowerCase();
    window.clearTimeout(typeaheadTimer.current);
    typeaheadTimer.current = window.setTimeout(() => {
      typeaheadRef.current = "";
    }, 450);
    const match = options.findIndex((option) =>
      option.label.toLowerCase().startsWith(typeaheadRef.current),
    );
    if (match >= 0) setActiveIndex(match);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((current) => {
        if (event.key === "ArrowDown") {
          return Math.min(current + 1, options.length - 1);
        }
        return Math.max(current - 1, 0);
      });
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(options.length - 1, 0));
      return;
    }

    if (event.key === "Enter" && open && options[activeIndex]) {
      event.preventDefault();
      handleSelect(options[activeIndex].value);
      return;
    }

    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      handleTypeahead(event.key);
    }
  }

  if (disabled) {
    return (
      <div className={cn("relative min-w-0", className)}>
        <div
          className={cn(
            adminSelectClassName,
            "flex items-center opacity-60",
            isSm ? "h-8 rounded-lg pl-2.5 pr-7 text-xs" : "pr-10",
            isPlaceholder && "text-fg-muted",
            selectClassName,
          )}
        >
          <span className="truncate">{selectedLabel}</span>
        </div>
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center text-fg-muted",
            isSm ? "w-7" : "w-9",
          )}
          aria-hidden
        >
          <Icon name="expand_more" size={chevronSize} />
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
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
            className={cn(
              adminSelectClassName,
              "relative flex items-center text-left",
              isSm && "h-8 rounded-lg pl-2.5 pr-7 text-xs font-semibold",
              isPlaceholder && "text-fg-muted",
              selectClassName,
            )}
          >
            <span className={cn("truncate", isSm ? "pr-5" : "pr-8")}>
              {selectedLabel}
            </span>
            <span
              className={cn(
                "pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center text-fg-muted",
                isSm ? "w-7" : "w-9",
              )}
              aria-hidden
            >
              <Icon
                name="expand_more"
                size={chevronSize}
                className={cn("transition-transform", open && "rotate-180")}
              />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-[var(--radix-popover-trigger-width)] p-0",
            isSm ? "min-w-[5.5rem]" : "min-w-[12rem]",
            contentClassName,
          )}
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <ul
            id={listboxId}
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
          >
            {options.map((option, index) => {
              const isSelected = option.value === selectedValue;
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
                      adminMenuItemClassName({
                        active: isActive,
                        selected: isSelected,
                      }),
                      isSm && "px-2.5 py-1.5 text-xs font-semibold",
                      option.disabled && "cursor-not-allowed opacity-50",
                      option.value === "" && !isSelected && "text-fg-2",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {isSelected && (
                      <Icon
                        name="check"
                        size={checkSize}
                        className="shrink-0 text-brand"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
      <input
        type="hidden"
        name={name ?? (id ? `${id}-value` : undefined)}
        value={selectedValue}
        required={required}
        tabIndex={-1}
        aria-hidden
        onChange={() => {}}
      />
    </div>
  );
}

function optionsFromChildren(children: React.ReactNode): Array<{
  value: string;
  label: string;
  disabled?: boolean;
}> {
  const options: Array<{ value: string; label: string; disabled?: boolean }> =
    [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{
      value?: string | number;
      disabled?: boolean;
      children?: React.ReactNode;
    }>(child)) {
      return;
    }
    if (child.type !== "option") return;
    const value =
      child.props.value == null ? "" : String(child.props.value);
    options.push({
      value,
      label: childText(child.props.children) || value,
      disabled: Boolean(child.props.disabled),
    });
  });

  return options;
}

function childText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return childText(node.props.children);
  }
  return "";
}

export { DatePicker as AdminDatePicker } from "@/components/date-picker";
export { DateRangePicker as AdminDateRangePicker } from "@/components/date-range-picker";

export const AdminSearchInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
    variant?: "default" | "menu";
  } & Omit<React.ComponentProps<"input">, "value" | "onChange" | "type">
>(function AdminSearchInput(
  { value, onChange, placeholder, className, id, variant = "default", ...props },
  ref,
) {
  return (
    <div className={cn("relative min-w-[12rem] w-full", className)}>
      <Icon
        name="search"
        size={20}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted"
      />
      <input
        ref={ref}
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          variant === "menu"
            ? adminMenuSearchClassName
            : adminSearchInputClassName
        }
        {...props}
      />
    </div>
  );
});

/** Indonesian Rupiah text input: auto-prefixes `Rp.` and inserts thousand dots. */
export const AdminCurrencyInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onValueChange: (formatted: string) => void;
  } & Omit<React.ComponentProps<"input">, "type" | "value" | "onChange">
>(function AdminCurrencyInput(
  { value, onValueChange, className, placeholder = "Rp. 0", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      pattern="^Rp\.\s?\d{1,3}(\.\d{3})*$"
      placeholder={placeholder}
      className={cn(adminInputClassName, className)}
      value={value}
      onChange={(e) => onValueChange(formatIdrInput(e.target.value))}
      {...props}
    />
  );
});

export function AdminPasswordInput({
  id,
  value,
  onChange,
  required,
  autoComplete = "new-password",
  showLabel,
  hideLabel,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  showLabel: string;
  hideLabel: string;
  className?: string;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        className={cn(adminInputClassName, "pr-10", className)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-fg-muted transition-colors hover:text-brand"
        aria-label={visible ? hideLabel : showLabel}
      >
        <Icon name={visible ? "visibility_off" : "visibility"} size={20} />
      </button>
    </div>
  );
}

import * as React from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { RequiredMark } from "@/components/shared/required-mark";
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

const adminControlBase =
  "w-full rounded-xl border border-[#d5c3b8] bg-[#faf9f6] text-sm text-[#1a1c1a] transition-colors focus:border-[#8b5e3c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/15";

export const adminInputClassName = cn(
  adminControlBase,
  "h-10 px-3.5 placeholder:text-[#83746b]/60",
);

export const adminSelectClassName = cn(
  adminControlBase,
  "h-10 cursor-pointer appearance-none pl-3.5 pr-10",
);

export const adminSearchInputClassName = cn(
  adminControlBase,
  "h-10 pl-10 pr-4 placeholder:text-[#83746b]/60",
);

export const adminTextareaClassName = cn(
  adminControlBase,
  "min-h-[8.5rem] resize-y px-3.5 py-3 leading-relaxed placeholder:text-[#83746b]/60",
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
        "flex w-full items-center gap-3 rounded-xl border border-[#d5c3b8] bg-[#faf9f6] px-3 py-2.5",
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
        className="shrink-0 rounded-lg border border-[#d5c3b8] bg-white px-3 py-1.5 text-sm font-semibold text-[#51443c] transition-colors hover:border-[#8b5e3c]/40 hover:bg-[#efeeeb] disabled:cursor-not-allowed"
      >
        {t("chooseFile")}
      </button>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          (multiple ? selectedCount > 0 : !!file)
            ? "font-medium text-[#1a1c1a]"
            : "text-[#83746b]",
        )}
      >
        {label}
      </span>
      {!multiple && file ? (
        <button
          type="button"
          disabled={disabled}
          onClick={handleClear}
          className="shrink-0 rounded-lg p-1.5 text-[#83746b] transition-colors hover:bg-[#efeeeb] hover:text-[#51443c] disabled:cursor-not-allowed"
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
  children,
  ...props
}: React.ComponentProps<"select"> & {
  className?: string;
  selectClassName?: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <select
        className={cn(adminSelectClassName, selectClassName)}
        {...props}
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-[#83746b]"
        aria-hidden
      >
        <Icon name="expand_more" size={20} />
      </span>
    </div>
  );
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
  } & Omit<React.ComponentProps<"input">, "value" | "onChange" | "type">
>(function AdminSearchInput(
  { value, onChange, placeholder, className, id, ...props },
  ref,
) {
  return (
    <div className={cn("relative min-w-[12rem] w-full", className)}>
      <Icon
        name="search"
        size={20}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746b]"
      />
      <input
        ref={ref}
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={adminSearchInputClassName}
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

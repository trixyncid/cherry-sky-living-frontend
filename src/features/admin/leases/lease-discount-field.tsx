"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import {
  AdminCurrencyInput,
  AdminField,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { formatIdr, parseIdrInput } from "@/features/admin/lib/format";
import type { LeaseDiscountInput } from "@/lib/billing";
import type { LeaseDiscountType } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export type LeaseDiscountFormState = {
  discountType: LeaseDiscountType | "";
  /** Formatted Rupiah ("Rp. 100.000"). */
  discountAmount: string;
  /** Whole percent as typed. */
  discountPercent: string;
  discountNote: string;
};

export const emptyLeaseDiscount: LeaseDiscountFormState = {
  discountType: "",
  discountAmount: "",
  discountPercent: "",
  discountNote: "",
};

/** Discount as the API / preview expects it. */
export function leaseDiscountFromForm(
  form: LeaseDiscountFormState,
): LeaseDiscountInput {
  if (form.discountType === "amount") {
    return { type: "amount", value: parseIdrInput(form.discountAmount) };
  }
  if (form.discountType === "percent") {
    const pct = Number.parseInt(form.discountPercent, 10);
    return { type: "percent", value: Number.isFinite(pct) ? pct : 0 };
  }
  return { type: null, value: 0 };
}

/** Error key under admin.pages.leases.discount, or null when valid. */
export function leaseDiscountError(
  form: LeaseDiscountFormState,
): "errorValue" | "errorPercent" | null {
  const discount = leaseDiscountFromForm(form);
  if (!discount.type) return null;
  if (discount.value <= 0) return "errorValue";
  if (discount.type === "percent" && discount.value > 100) {
    return "errorPercent";
  }
  return null;
}

const OPTIONS: { value: LeaseDiscountType | ""; icon: string; key: string }[] =
  [
    { value: "", icon: "block", key: "none" },
    { value: "amount", icon: "payments", key: "amount" },
    { value: "percent", icon: "percent", key: "percent" },
  ];

/**
 * Per-lease discount: none, a Rupiah amount off the lease total (earliest
 * bills first) or a percentage off every bill, with an optional note.
 */
export function LeaseDiscountField({
  value,
  onChange,
  totalOff,
  repricesUnpaidOnly,
}: {
  value: LeaseDiscountFormState;
  onChange: (next: Partial<LeaseDiscountFormState>) => void;
  /** Rupiah the discount takes off, when the bills can be previewed. */
  totalOff?: number | null;
  /** Editing a lease: only bills not yet paid change. */
  repricesUnpaidOnly?: boolean;
}) {
  const t = useTranslations("admin.pages.leases.discount");
  const type = value.discountType;
  const error = leaseDiscountError(value);
  const typed =
    type === "amount"
      ? parseIdrInput(value.discountAmount) > 0
      : type === "percent"
        ? value.discountPercent.trim() !== ""
        : false;

  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 flex w-full items-baseline justify-between gap-2 text-sm font-medium text-fg">
        <span>{t("label")}</span>
        <span className="text-xs font-normal text-fg-muted">
          {t("optional")}
        </span>
      </legend>

      <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-subtle p-1">
        {OPTIONS.map((option) => {
          const checked = type === option.value;
          return (
            <label
              key={option.key}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30",
                checked
                  ? "bg-panel text-fg shadow-sm ring-1 ring-line"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <input
                type="radio"
                name="lease-discount-type"
                className="sr-only"
                checked={checked}
                onChange={() => onChange({ discountType: option.value })}
              />
              <Icon
                name={option.icon}
                size={16}
                className={checked ? "text-brand" : undefined}
              />
              {t(option.key)}
            </label>
          );
        })}
      </div>

      {type ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField
            label={type === "amount" ? t("amountLabel") : t("percentLabel")}
            htmlFor="lease-discount-value"
            required
          >
            {type === "amount" ? (
              <AdminCurrencyInput
                id="lease-discount-value"
                value={value.discountAmount}
                onValueChange={(discountAmount) => onChange({ discountAmount })}
              />
            ) : (
              <div className="relative">
                <input
                  id="lease-discount-value"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="10"
                  className={cn(adminInputClassName, "pr-10")}
                  value={value.discountPercent}
                  onChange={(e) =>
                    onChange({
                      discountPercent: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 3),
                    })
                  }
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-fg-muted">
                  %
                </span>
              </div>
            )}
            {typed && error ? (
              <p className="text-xs text-danger">{t(error)}</p>
            ) : null}
          </AdminField>
          <AdminField label={t("noteLabel")} htmlFor="lease-discount-note">
            <input
              id="lease-discount-note"
              type="text"
              maxLength={200}
              placeholder={t("notePlaceholder")}
              className={adminInputClassName}
              value={value.discountNote}
              onChange={(e) => onChange({ discountNote: e.target.value })}
            />
          </AdminField>
          <div className="flex items-start gap-2 rounded-xl bg-brand-tint px-3.5 py-2.5 text-xs leading-relaxed text-fg-2 sm:col-span-2">
            <Icon name="sell" size={16} className="mt-px shrink-0 text-brand" />
            <span>
              {type === "amount" ? t("amountHint") : t("percentHint")}
              {totalOff && totalOff > 0 && !error ? (
                <>
                  {" "}
                  <strong className="font-semibold text-fg">
                    {t("totalOff", { amount: formatIdr(totalOff) })}
                  </strong>
                </>
              ) : null}
              {repricesUnpaidOnly ? <> {t("unpaidOnly")}</> : null}
            </span>
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}

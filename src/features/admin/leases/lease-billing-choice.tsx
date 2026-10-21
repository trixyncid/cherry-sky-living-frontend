"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Icon } from "@/components/shared/Icon";
import { formatDate, formatIdr } from "@/features/admin/lib/format";
import {
  applyLeaseDiscount,
  type BillingCycle,
  daysInMonth,
  type FirstPeriodMode,
  inclusiveMonthCount,
  type LeaseDiscountInput,
  previewInvoiceSchedule,
} from "@/lib/billing";
import { parseDateOnly } from "@/lib/date-input";
import { cn } from "@/lib/utils";

function OptionCard({
  name,
  checked,
  onSelect,
  icon,
  title,
  hint,
  compact,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  icon?: string;
  title: string;
  hint: string;
  compact?: boolean;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-xl border bg-panel transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30",
        compact ? "px-3.5 py-3" : "p-4",
        checked
          ? "border-brand bg-brand-tint"
          : "border-line hover:border-line-strong",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {icon ? (
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            checked ? "bg-brand text-white" : "bg-hover text-fg-2",
          )}
        >
          <Icon name={icon} size={18} />
        </span>
      ) : (
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
            checked ? "border-brand bg-brand" : "border-line-strong bg-panel",
          )}
        >
          {checked ? <span className="size-1.5 rounded-full bg-white" /> : null}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">
          {hint}
        </span>
      </span>
    </label>
  );
}

/**
 * New-lease payment settings: monthly vs up front, how a mid-month move-in
 * is billed, and a preview of the bills the server will create.
 */
export function LeaseBillingChoice({
  billingCycle,
  firstPeriodMode,
  onChange,
  startDate,
  endDate,
  monthlyPrice,
  dailyRate,
  paymentDueDay,
  discount,
}: {
  billingCycle: BillingCycle;
  firstPeriodMode: FirstPeriodMode;
  onChange: (next: {
    billingCycle?: BillingCycle;
    firstPeriodMode?: FirstPeriodMode;
  }) => void;
  startDate: string;
  endDate: string;
  monthlyPrice?: number;
  dailyRate?: number | null;
  paymentDueDay: number;
  discount?: LeaseDiscountInput;
}) {
  const t = useTranslations("admin.pages.leases.billing");
  const td = useTranslations("admin.pages.leases.discount");
  const locale = useLocale();
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const stubDays =
    start && start.getDate() !== 1
      ? daysInMonth(start) - start.getDate() + 1
      : 0;
  const showFirstMonth =
    billingCycle === "monthly" &&
    stubDays > 0 &&
    !!start &&
    !!end &&
    inclusiveMonthCount(start, end) > 1;

  const preview = useMemo(() => {
    const from = parseDateOnly(startDate);
    const to = parseDateOnly(endDate);
    if (!from || !to || !monthlyPrice) return null;
    try {
      return applyLeaseDiscount(
        previewInvoiceSchedule({
          startDate: from,
          endDate: to,
          monthlyPrice,
          dailyRate,
          billingCycle,
          firstPeriodMode,
          paymentDueDay,
        }),
        discount ?? { type: null, value: 0 },
      );
    } catch {
      return null;
    }
  }, [
    startDate,
    endDate,
    monthlyPrice,
    dailyRate,
    billingCycle,
    firstPeriodMode,
    paymentDueDay,
    discount,
  ]);
  const total = preview?.reduce((sum, row) => sum + row.amount, 0) ?? 0;
  const discountTotal =
    preview?.reduce((sum, row) => sum + (row.discount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">
          {t("cycleLabel")}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <OptionCard
            name="lease-billing-cycle"
            icon="event_repeat"
            checked={billingCycle === "monthly"}
            onSelect={() => onChange({ billingCycle: "monthly" })}
            title={t("cycleMonthly")}
            hint={t("cycleMonthlyHint", { day: paymentDueDay })}
          />
          <OptionCard
            name="lease-billing-cycle"
            icon="payments"
            checked={billingCycle === "upfront"}
            onSelect={() => onChange({ billingCycle: "upfront" })}
            title={t("cycleUpfront")}
            hint={t("cycleUpfrontHint")}
          />
        </div>
      </fieldset>

      {showFirstMonth ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">
            {t("firstMonthLabel")}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <OptionCard
              compact
              name="lease-first-period"
              checked={firstPeriodMode === "separate"}
              onSelect={() => onChange({ firstPeriodMode: "separate" })}
              title={t("firstSeparate")}
              hint={t("firstSeparateHint", { days: stubDays })}
            />
            <OptionCard
              compact
              name="lease-first-period"
              checked={firstPeriodMode === "merged"}
              onSelect={() => onChange({ firstPeriodMode: "merged" })}
              title={t("firstMerged")}
              hint={t("firstMergedHint", { days: stubDays })}
            />
          </div>
        </fieldset>
      ) : null}

      <div className="rounded-xl border border-line bg-subtle">
        <p className="border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
          {t("previewTitle")}
        </p>
        {preview && preview.length > 0 ? (
          <>
            <ol className="divide-y divide-line">
              {preview.map((row, i) => (
                <li
                  key={row.periodStart.toISOString()}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-fg">
                      {t("billLabel", { n: i + 1 })}
                    </span>
                    <span className="ml-2 text-fg-muted">
                      {formatDate(row.periodStart, locale)} –{" "}
                      {formatDate(row.periodEnd, locale)}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {t("dueOn", { date: formatDate(row.dueDate, locale) })}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {row.discount ? (
                      <span className="block text-xs tabular-nums text-fg-muted line-through">
                        {formatIdr(row.amount + row.discount)}
                      </span>
                    ) : null}
                    <span className="font-semibold tabular-nums text-fg">
                      {formatIdr(row.amount)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            {discountTotal > 0 ? (
              <p className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm">
                <span className="flex items-center gap-1.5 font-medium text-fg-2">
                  <Icon name="sell" size={15} className="text-brand" />
                  {td("label")}
                </span>
                <span className="font-semibold tabular-nums text-success">
                  −{formatIdr(discountTotal)}
                </span>
              </p>
            ) : null}
            <p className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm">
              <span className="font-medium text-fg-2">{t("total")}</span>
              <span className="font-semibold tabular-nums text-brand">
                {formatIdr(total)}
              </span>
            </p>
          </>
        ) : (
          <p className="px-4 py-3 text-sm text-fg-muted">{t("previewEmpty")}</p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { formatDate, formatIdrTable } from "@/features/admin/lib/format";
import { tenantPaymentView } from "@/features/tenant/lib/payment-view";
import type { Lease, LeaseInvoice } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

/** Every amount on this card carries "Rp", like the home screen. */
const idr = (amount: number) => `Rp ${formatIdrTable(amount)}`;

type PaymentTone = "due" | "review" | "paid";

function toneForStatus(status: Lease["status"]): PaymentTone {
  if (status === "paid") return "paid";
  if (status === "waiting_for_review") return "review";
  return "due";
}

export function TenantLeasePaymentSummary({ lease }: { lease: Lease }) {
  const tp = useTranslations("tenant.pages.leases.payment");

  const view = tenantPaymentView(lease);
  const tone = toneForStatus(view.status);
  const rentDue = view.amount;
  const lateFee = view.lateFee;
  const totalDue = rentDue + lateFee;
  const daysLate = view.daysLate;
  const isOverdue = tone !== "paid" && daysLate > 0;
  const monthlyRate = lease.unitPricing?.price ?? null;
  const showRateNote =
    monthlyRate != null && monthlyRate > 0 && monthlyRate !== rentDue;

  const heroLabel =
    tone === "paid"
      ? tp("paidAmountLabel")
      : tone === "review"
        ? tp("reviewAmountLabel")
        : tp("totalToPay");

  const heroAmount = tone === "paid" ? rentDue : totalDue;

  return (
    <section
      className="glass-panel relative overflow-hidden rounded-lg"
      aria-label={tp("title")}
    >
      <div className="relative border-b border-line px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/40",
                tone === "paid" && "bg-success",
                tone === "review" && "bg-brand",
                tone === "due" && "bg-brand",
              )}
            >
              <Icon
                name={
                  tone === "paid"
                    ? "check_circle"
                    : tone === "review"
                      ? "hourglass_top"
                      : "payments"
                }
                size={22}
                className="text-white"
              />
            </div>
            <div>
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.16em]",
                  tone === "paid" && "text-emerald-800",
                  tone === "review" && "text-brand",
                  tone === "due" && "text-brand",
                )}
              >
                {tp("badge")}
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-fg">
                {tone === "paid"
                  ? tp("titlePaid")
                  : tone === "review"
                    ? tp("titleReview")
                    : tp("titleDue")}
              </h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-fg-2">
                {tone === "paid"
                  ? tp("hintPaid")
                  : tone === "review"
                    ? tp("hintReview")
                    : isOverdue
                      ? tp("hintOverdue", { days: daysLate })
                      : tp("hintDue")}
              </p>
            </div>
          </div>

          {view.dueDate != null && tone !== "paid" && (
            <div
              className={cn(
                "rounded-lg border px-3.5 py-2.5 text-right",
                isOverdue
                  ? "border-danger/25 bg-danger-soft"
                  : "border-line bg-white",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
                {tp("dueBy")}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-sm font-bold tabular-nums",
                  isOverdue ? "text-danger" : "text-fg",
                )}
              >
                {formatDate(view.dueDate)}
              </p>
              {isOverdue && (
                <p className="mt-1 text-xs font-semibold text-danger">
                  {tp("daysLateBadge", { days: daysLate })}
                </p>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            "mt-5 rounded-2xl border px-4 py-4 sm:px-5",
            tone === "paid" && "border-success/25 bg-success-soft",
            tone === "review" && "border-brand-line bg-brand-tint",
            tone === "due" && "border-line bg-subtle",
          )}
        >
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.16em]",
              tone === "paid" && "text-emerald-800",
              tone === "review" && "text-brand",
              tone === "due" && "text-brand",
            )}
          >
            {heroLabel}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-fg tabular-nums sm:text-4xl">
            {idr(heroAmount)}
          </p>
          {tone !== "paid" && lateFee > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-fg-2">
              {tp("totalIncludesLateFee", {
                rent: idr(rentDue),
                lateFee: idr(lateFee),
              })}
            </p>
          )}
        </div>
      </div>

      <div className="relative px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
          {tp("breakdownTitle")}
        </p>

        <dl className="mt-2 divide-y divide-dashed divide-line/55">
          <BreakdownRow
            label={tp("rentLine")}
            hint={tp("rentLineHint")}
            amount={idr(rentDue)}
          />
          {(tone !== "paid" || lateFee > 0) && (
            <BreakdownRow
              label={tp("lateFeeLine")}
              hint={
                lateFee > 0 && daysLate > 0
                  ? tp("lateFeeLineHint", {
                      days: daysLate,
                      perDay: idr(lease.lateFeePerDay ?? 0),
                    })
                  : tp("lateFeeLineHintNone")
              }
              amount={idr(lateFee)}
              emphasis={lateFee > 0 ? "warn" : undefined}
            />
          )}
          <BreakdownRow
            label={tone === "paid" ? tp("paidTotalLine") : tp("totalLine")}
            amount={idr(heroAmount)}
            emphasis="total"
          />
        </dl>

        {view.next ? (
          <p className="mt-4 rounded-lg border border-line bg-subtle px-3.5 py-2.5 text-xs leading-relaxed text-fg-2">
            {tp("nextBill", {
              amount: idr(view.next.amount),
              date: formatDate(view.next.dueDate),
            })}
          </p>
        ) : null}

        {(lease.invoices?.length ?? 0) > 1 ? (
          <BillSchedule invoices={lease.invoices ?? []} />
        ) : null}

        {showRateNote && (
          <p className="mt-4 rounded-lg border border-line bg-subtle px-3.5 py-2.5 text-xs leading-relaxed text-fg-2">
            {tp("monthlyRateNote", {
              rate: idr(monthlyRate),
            })}
          </p>
        )}
      </div>
    </section>
  );
}

function BreakdownRow({
  label,
  hint,
  amount,
  emphasis,
}: {
  label: string;
  hint?: string;
  amount: string;
  emphasis?: "total" | "warn";
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt
          className={cn(
            "text-sm font-medium text-fg-2",
            emphasis === "total" && "font-bold text-fg",
          )}
        >
          {label}
        </dt>
        {hint ? (
          <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{hint}</p>
        ) : null}
      </div>
      <dd
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums text-fg",
          emphasis === "total" && "text-base font-bold",
          emphasis === "warn" && "text-danger",
        )}
      >
        {amount}
      </dd>
    </div>
  );
}

const billStatusClass: Record<LeaseInvoice["status"], string> = {
  paid: "bg-success-soft text-success",
  unpaid: "bg-brand-soft text-danger",
  waiting_for_review: "bg-brand-soft text-brand",
};

/** Every bill of a monthly lease, so tenants see which months are paid. */
function BillSchedule({ invoices }: { invoices: LeaseInvoice[] }) {
  const tp = useTranslations("tenant.pages.leases.payment");
  const locale = useLocale();
  const statusLabel = {
    paid: tp("statusPaid"),
    unpaid: tp("statusUnpaid"),
    waiting_for_review: tp("statusReview"),
  } as const;

  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        {tp("scheduleTitle")}
      </p>
      <ol className="mt-2 divide-y divide-line rounded-lg border border-line bg-white">
        {invoices.map((inv) => (
          <li
            key={inv.id}
            className="flex items-start justify-between gap-3 px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">
                {tp("billLabel", { n: inv.sequence })}
                <span className="ml-2 font-normal text-fg-muted">
                  {formatDate(inv.periodStart, locale)} –{" "}
                  {formatDate(inv.periodEnd, locale)}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-fg-muted">
                {inv.status === "paid" && inv.paidAt
                  ? tp("paidOn", { date: formatDate(inv.paidAt, locale) })
                  : tp("dueOn", { date: formatDate(inv.dueDate, locale) })}
                {inv.discount
                  ? ` · ${tp("discount", { amount: idr(inv.discount) })}`
                  : ""}
                {inv.lateFeeWaived
                  ? ` · ${
                      inv.lateFeeWaivedAmount
                        ? tp("feeWaivedDetail", {
                            amount: idr(inv.lateFeeWaivedAmount),
                            days: inv.lateFeeWaivedDays ?? 0,
                          })
                        : tp("feeWaived")
                    }`
                  : inv.lateFeeAmount > 0
                    ? ` · ${tp("lateFee", { amount: idr(inv.lateFeeAmount) })}`
                    : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {inv.discount ? (
                <span className="text-xs tabular-nums text-fg-muted line-through">
                  {idr(inv.amount + inv.discount)}
                </span>
              ) : null}
              <span className="text-sm font-semibold tabular-nums text-fg">
                {idr(inv.amount)}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  billStatusClass[inv.status],
                )}
              >
                {statusLabel[inv.status]}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

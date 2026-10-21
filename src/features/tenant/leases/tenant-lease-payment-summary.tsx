"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { formatDate, formatIdrTable } from "@/features/admin/lib/format";
import { tenantPaymentView } from "@/features/tenant/lib/payment-view";
import type { Lease, LeaseInvoice } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

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
      className="glass-panel relative overflow-hidden rounded-[1.75rem]"
      aria-label={tp("title")}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-20 size-56 rounded-full blur-3xl",
          tone === "paid" && "bg-emerald-500/15",
          tone === "review" && "bg-amber-400/20",
          tone === "due" && "bg-ferrugem/15",
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-10 size-48 rounded-full bg-maroon/8 blur-3xl"
        aria-hidden
      />

      <div className="relative border-b border-[#d5c3b8]/45 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-[0_8px_20px_rgb(90_36_48/0.18)] ring-1 ring-white/40",
                tone === "paid" &&
                  "bg-gradient-to-br from-emerald-600 via-emerald-700 to-[#0F5C2E]",
                tone === "review" &&
                  "bg-gradient-to-br from-amber-500 via-[#c47a1a] to-[#8A4B00]",
                tone === "due" &&
                  "bg-gradient-to-br from-[#8a1a12] via-[#71130d] to-maroon",
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
                  "text-[11px] font-semibold uppercase tracking-[0.16em]",
                  tone === "paid" && "text-emerald-800",
                  tone === "review" && "text-[#8A4B00]",
                  tone === "due" && "text-ferrugem",
                )}
              >
                {tp("badge")}
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-[#141414]">
                {tone === "paid"
                  ? tp("titlePaid")
                  : tone === "review"
                    ? tp("titleReview")
                    : tp("titleDue")}
              </h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-[#3d3a36]">
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
                "rounded-2xl border px-3.5 py-2.5 text-right",
                isOverdue
                  ? "border-red-300/50 bg-red-500/8"
                  : "border-[#d5c3b8]/70 bg-white/55",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                {tp("dueBy")}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-sm font-bold tabular-nums",
                  isOverdue ? "text-[#ba1a1a]" : "text-[#141414]",
                )}
              >
                {formatDate(view.dueDate)}
              </p>
              {isOverdue && (
                <p className="mt-1 text-[11px] font-semibold text-[#ba1a1a]">
                  {tp("daysLateBadge", { days: daysLate })}
                </p>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            "mt-5 rounded-2xl border px-4 py-4 sm:px-5",
            tone === "paid" &&
              "border-emerald-300/45 bg-gradient-to-br from-white/85 via-[#f3faf5]/90 to-emerald-50/60",
            tone === "review" &&
              "border-amber-300/45 bg-gradient-to-br from-white/85 via-[#fff8eb]/90 to-amber-50/50",
            tone === "due" &&
              "border-[#d5c3b8]/50 bg-gradient-to-br from-white/80 via-[#faf9f6]/90 to-ferrugem-soft/35",
          )}
        >
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.16em]",
              tone === "paid" && "text-emerald-800",
              tone === "review" && "text-[#8A4B00]",
              tone === "due" && "text-ferrugem",
            )}
          >
            {heroLabel}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-[#141414] tabular-nums sm:text-4xl">
            {formatIdrTable(heroAmount)}
          </p>
          {tone !== "paid" && lateFee > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-[#3d3a36]">
              {tp("totalIncludesLateFee", {
                rent: formatIdrTable(rentDue),
                lateFee: formatIdrTable(lateFee),
              })}
            </p>
          )}
        </div>
      </div>

      <div className="relative px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
          {tp("breakdownTitle")}
        </p>

        <dl className="mt-2 divide-y divide-dashed divide-[#d5c3b8]/55">
          <BreakdownRow
            label={tp("rentLine")}
            hint={tp("rentLineHint")}
            amount={formatIdrTable(rentDue)}
          />
          {(tone !== "paid" || lateFee > 0) && (
            <BreakdownRow
              label={tp("lateFeeLine")}
              hint={
                lateFee > 0 && daysLate > 0
                  ? tp("lateFeeLineHint", {
                      days: daysLate,
                      perDay: formatIdrTable(lease.lateFeePerDay ?? 0),
                    })
                  : tp("lateFeeLineHintNone")
              }
              amount={formatIdrTable(lateFee)}
              emphasis={lateFee > 0 ? "warn" : undefined}
            />
          )}
          <BreakdownRow
            label={tone === "paid" ? tp("paidTotalLine") : tp("totalLine")}
            amount={formatIdrTable(heroAmount)}
            emphasis="total"
          />
        </dl>

        {view.next ? (
          <p className="mt-4 rounded-xl border border-[#d5c3b8]/45 bg-white/45 px-3.5 py-2.5 text-xs leading-relaxed text-[#3d3a36]">
            {tp("nextBill", {
              amount: formatIdrTable(view.next.amount),
              date: formatDate(view.next.dueDate),
            })}
          </p>
        ) : null}

        {(lease.invoices?.length ?? 0) > 1 ? (
          <BillSchedule invoices={lease.invoices ?? []} />
        ) : null}

        {showRateNote && (
          <p className="mt-4 rounded-xl border border-[#d5c3b8]/45 bg-white/45 px-3.5 py-2.5 text-xs leading-relaxed text-[#3d3a36]">
            {tp("monthlyRateNote", {
              rate: formatIdrTable(monthlyRate),
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
            "text-sm font-medium text-[#3d3a36]",
            emphasis === "total" && "font-bold text-[#141414]",
          )}
        >
          {label}
        </dt>
        {hint ? (
          <p className="mt-0.5 text-xs leading-relaxed text-[#6b6b6b]">
            {hint}
          </p>
        ) : null}
      </div>
      <dd
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums text-[#141414]",
          emphasis === "total" && "text-base font-bold",
          emphasis === "warn" && "text-[#ba1a1a]",
        )}
      >
        {amount}
      </dd>
    </div>
  );
}

const billStatusClass: Record<LeaseInvoice["status"], string> = {
  paid: "bg-[#dff3d6] text-[#2f6d22]",
  unpaid: "bg-[#fde2df] text-[#a1271b]",
  waiting_for_review: "bg-[#f9e3c8] text-[#8a5a2b]",
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
        {tp("scheduleTitle")}
      </p>
      <ol className="mt-2 divide-y divide-[#d5c3b8]/45 rounded-2xl border border-[#d5c3b8]/55 bg-white/60">
        {invoices.map((inv) => (
          <li
            key={inv.id}
            className="flex items-start justify-between gap-3 px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#141414]">
                {tp("billLabel", { n: inv.sequence })}
                <span className="ml-2 font-normal text-[#6b6b6b]">
                  {formatDate(inv.periodStart, locale)} –{" "}
                  {formatDate(inv.periodEnd, locale)}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-[#6b6b6b]">
                {inv.status === "paid" && inv.paidAt
                  ? tp("paidOn", { date: formatDate(inv.paidAt, locale) })
                  : tp("dueOn", { date: formatDate(inv.dueDate, locale) })}
                {inv.discount
                  ? ` · ${tp("discount", { amount: formatIdrTable(inv.discount) })}`
                  : ""}
                {inv.lateFeeWaived
                  ? ` · ${tp("feeWaived")}`
                  : inv.lateFeeAmount > 0
                    ? ` · ${tp("lateFee", { amount: formatIdrTable(inv.lateFeeAmount) })}`
                    : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {inv.discount ? (
                <span className="text-xs tabular-nums text-[#6b6b6b] line-through">
                  {formatIdrTable(inv.amount + inv.discount)}
                </span>
              ) : null}
              <span className="text-sm font-semibold tabular-nums text-[#141414]">
                {formatIdrTable(inv.amount)}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
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

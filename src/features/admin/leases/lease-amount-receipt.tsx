"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { formatDate, formatIdrTable } from "@/features/admin/lib/format";
import type { LeaseAmountBreakdown } from "@/lib/billing";
import { cn } from "@/lib/utils";

export type LeaseAmountReceiptDetails = {
  monthlyRate: number;
  dailyRate: number;
  startStubSubtotal: number;
  endStubSubtotal: number;
  monthlySubtotal: number;
};

type LeaseAmountReceiptProps = {
  breakdown: LeaseAmountBreakdown;
  details: LeaseAmountReceiptDetails;
  startDate: string;
  endDate: string;
  unitLabel?: string | null;
  propertyLabel?: string | null;
  className?: string;
  /** Optional action shown in the receipt header (e.g. PDF download). */
  headerAction?: ReactNode;
};

type LineItem = {
  key: string;
  label: string;
  hint: string;
  equation: string;
  amount: number;
};

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#d5c3b8]/45 bg-white/50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#141414]">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <dt className="text-[#3d3a36]">{label}</dt>
      <dd className="shrink-0 font-semibold tabular-nums text-[#141414]">
        {value}
      </dd>
    </div>
  );
}

function ReceiptLine({
  index,
  label,
  hint,
  equation,
  amount,
}: LineItem & { index: number }) {
  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#71130d]/10 text-xs font-bold text-[#71130d]">
        {index}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-[#141414]">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[#6b6b6b]">{hint}</p>
        <p className="mt-1.5 inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-lg border border-[#d5c3b8]/50 bg-white/55 px-2 py-1 font-mono text-[11px] tabular-nums text-[#3d3a36]">
          {equation}
        </p>
      </div>
      <p className="text-right text-base font-bold tabular-nums text-[#141414] sm:pt-0.5">
        {formatIdrTable(amount)}
      </p>
    </div>
  );
}

export function LeaseAmountReceipt({
  breakdown,
  details,
  startDate,
  endDate,
  unitLabel,
  propertyLabel,
  className,
  headerAction,
}: LeaseAmountReceiptProps) {
  const tp = useTranslations("admin.pages.leases");

  const lines: LineItem[] = [];

  if (breakdown.stubDays > 0) {
    lines.push({
      key: "start-stub",
      label: tp("startStubSubtotal"),
      hint: tp("receiptHintStartStub", { days: breakdown.stubDays }),
      equation: tp("receiptEquationDaily", {
        days: breakdown.stubDays,
        rate: formatIdrTable(details.dailyRate),
        amount: formatIdrTable(details.startStubSubtotal),
      }),
      amount: details.startStubSubtotal,
    });
  }

  if (breakdown.fullMonths > 0) {
    lines.push({
      key: "months",
      label: tp("monthlySubtotal"),
      hint: tp("receiptHintFullMonths", { months: breakdown.fullMonths }),
      equation: tp("receiptEquationMonthly", {
        months: breakdown.fullMonths,
        rate: formatIdrTable(details.monthlyRate),
        amount: formatIdrTable(details.monthlySubtotal),
      }),
      amount: details.monthlySubtotal,
    });
  }

  if (breakdown.endStubDays > 0) {
    lines.push({
      key: "end-stub",
      label: tp("endStubSubtotal"),
      hint: tp("receiptHintEndStub", { days: breakdown.endStubDays }),
      equation: tp("receiptEquationDaily", {
        days: breakdown.endStubDays,
        rate: formatIdrTable(details.dailyRate),
        amount: formatIdrTable(details.endStubSubtotal),
      }),
      amount: details.endStubSubtotal,
    });
  }

  if (lines.length === 0 && breakdown.amountDue > 0) {
    lines.push({
      key: "total-only",
      label: tp("amountDue"),
      hint: tp("receiptHintFullMonths", {
        months: Math.max(breakdown.fullMonths, 1),
      }),
      equation: tp("receiptEquationMonthly", {
        months: Math.max(breakdown.fullMonths, 1),
        rate: formatIdrTable(details.monthlyRate),
        amount: formatIdrTable(breakdown.amountDue),
      }),
      amount: breakdown.amountDue,
    });
  }

  const location = [unitLabel, propertyLabel].filter(Boolean).join(" · ");

  return (
    <section
      className={cn(
        "glass-panel relative overflow-hidden rounded-[1.75rem]",
        className,
      )}
      aria-label={tp("amountPreview")}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-ferrugem/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-10 size-48 rounded-full bg-maroon/10 blur-3xl"
        aria-hidden
      />

      <div className="relative border-b border-[#d5c3b8]/45 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8a1a12] via-[#71130d] to-maroon shadow-[0_8px_20px_rgb(90_36_48/0.22)] ring-1 ring-white/40">
              <Icon name="receipt_long" size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ferrugem">
                {tp("receiptBadge")}
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-[#141414]">
                {tp("amountPreview")}
              </h3>
              {location ? (
                <p className="mt-1 text-sm text-[#3d3a36]">{location}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerAction}
            <div className="rounded-full border border-[#d5c3b8]/70 bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71130d]">
              {tp("receiptDraft")}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-[#d5c3b8]/40 bg-white/45 px-3.5 py-3 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
              {tp("periodStart")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#141414]">
              {formatDate(startDate)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
              {tp("periodEnd")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#141414]">
              {formatDate(endDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="relative border-b border-[#d5c3b8]/40 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
          {tp("receiptRatesTitle")}
        </p>
        <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <DetailRow
            label={tp("monthlyRate")}
            value={formatIdrTable(details.monthlyRate)}
          />
          {details.dailyRate > 0 ? (
            <DetailRow
              label={tp("dailyRate")}
              value={formatIdrTable(details.dailyRate)}
            />
          ) : (
            <DetailRow label={tp("dailyRate")} value={tp("receiptDailyNotUsed")} />
          )}
        </dl>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <MetaChip
            label={tp("stubDays")}
            value={String(breakdown.stubDays)}
          />
          <MetaChip
            label={tp("fullMonths")}
            value={String(breakdown.fullMonths)}
          />
          <MetaChip
            label={tp("endStubDays")}
            value={String(breakdown.endStubDays)}
          />
        </div>
      </div>

      <div className="relative px-5 py-2 sm:px-6">
        <p className="pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
          {tp("receiptBreakdownTitle")}
        </p>
        <div className="divide-y divide-dashed divide-[#d5c3b8]/55">
          {lines.map((line, index) => (
            <ReceiptLine
              key={line.key}
              index={index + 1}
              label={line.label}
              hint={line.hint}
              equation={line.equation}
              amount={line.amount}
            />
          ))}
        </div>
      </div>

      <div className="relative mx-5 mb-5 rounded-2xl border border-[#d5c3b8]/50 bg-gradient-to-br from-white/80 via-[#faf9f6]/90 to-ferrugem-soft/35 px-4 py-4 sm:mx-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ferrugem">
              {tp("amountDue")}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414] tabular-nums sm:text-3xl">
              {formatIdrTable(breakdown.amountDue)}
            </p>
          </div>
        </div>
        <p className="mt-3 border-t border-[#d5c3b8]/45 pt-3 text-xs leading-relaxed text-[#6b6b6b]">
          {tp("receiptFooter")}
        </p>
      </div>
    </section>
  );
}

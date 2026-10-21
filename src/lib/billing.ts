/** Frontend mirror of backend calendar-month lease billing helpers. */

export const MONTHLY_DURATION_DAYS = 30;
export const DAILY_DURATION_DAYS = 1;

export const ALLOWED_PRICING_DURATIONS = [
  DAILY_DURATION_DAYS,
  MONTHLY_DURATION_DAYS,
] as const;

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 0, 0, 0, 0);
}

export function isLastDayOfMonth(date: Date): boolean {
  return date.getDate() === daysInMonth(date);
}

export function inclusiveMonthCount(startDate: Date, endDate: Date): number {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    1
  );
}

export type LeaseAmountBreakdown = {
  amountDue: number;
  /** Partial days at the start of the lease (mid-month move-in). */
  stubDays: number;
  /** Partial days at the end of the lease (mid-month move-out). */
  endStubDays: number;
  dailyRate: number;
  fullMonths: number;
};

function sameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function computeLeaseAmount(
  startDate: Date,
  endDate: Date,
  monthlyPrice: number,
  dailyRate?: number | null,
): LeaseAmountBreakdown {
  if (endDate < startDate) {
    throw new Error("endDate must be on or after startDate");
  }

  const startIsMonthStart = startDate.getDate() === 1;
  const endIsMonthEnd = isLastDayOfMonth(endDate);
  const needsDaily = !startIsMonthStart || !endIsMonthEnd;

  if (needsDaily && (dailyRate == null || dailyRate <= 0)) {
    throw new Error(
      "A 1-day pricing package is required for mid-month move-in or move-out. Set a daily price under Pricing.",
    );
  }

  // Full calendar months only — charge monthly rate.
  if (startIsMonthStart && endIsMonthEnd) {
    const fullMonths = inclusiveMonthCount(startDate, endDate);
    return {
      amountDue: fullMonths * monthlyPrice,
      stubDays: 0,
      endStubDays: 0,
      dailyRate: 0,
      fullMonths,
    };
  }

  // Entire stay is within one calendar month and is partial → daily only.
  if (sameCalendarMonth(startDate, endDate)) {
    const days = endDate.getDate() - startDate.getDate() + 1;
    const rate = dailyRate as number;
    if (startIsMonthStart) {
      return {
        amountDue: days * rate,
        stubDays: 0,
        endStubDays: days,
        dailyRate: rate,
        fullMonths: 0,
      };
    }
    return {
      amountDue: days * rate,
      stubDays: days,
      endStubDays: 0,
      dailyRate: rate,
      fullMonths: 0,
    };
  }

  const stubDays = startIsMonthStart
    ? 0
    : daysInMonth(startDate) - startDate.getDate() + 1;
  const endStubDays = endIsMonthEnd ? 0 : endDate.getDate();
  const fullMonths =
    inclusiveMonthCount(startDate, endDate) -
    (stubDays > 0 ? 1 : 0) -
    (endStubDays > 0 ? 1 : 0);

  return {
    amountDue:
      stubDays * (dailyRate as number) +
      endStubDays * (dailyRate as number) +
      fullMonths * monthlyPrice,
    stubDays,
    endStubDays,
    dailyRate: dailyRate as number,
    fullMonths,
  };
}

/** YYYY-MM-DD for last day of the month containing the given date input. */
export function toMonthEndInputValue(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const end = endOfMonth(d);
  const y = end.getFullYear();
  const m = String(end.getMonth() + 1).padStart(2, "0");
  const day = String(end.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type BillingCycle = "monthly" | "upfront";
export type FirstPeriodMode = "separate" | "merged";

export type PreviewInvoice = {
  periodStart: Date;
  periodEnd: Date;
  /** After discount. */
  amount: number;
  /** Taken off this bill by the lease discount. */
  discount?: number;
  dueDate: Date;
};

export type LeaseDiscountInput = {
  type: "amount" | "percent" | null;
  value: number;
};

/**
 * Mirror of the backend `applyLeaseDiscount`: percent comes off every bill;
 * a Rupiah amount comes off the lease total, earliest bills first. Bills never
 * go below zero.
 */
export function applyLeaseDiscount(
  schedule: PreviewInvoice[],
  discount: LeaseDiscountInput,
): PreviewInvoice[] {
  if (!discount.type || discount.value <= 0) {
    return schedule.map((row) => ({ ...row, discount: 0 }));
  }
  if (discount.type === "percent") {
    const pct = Math.min(discount.value, 100);
    return schedule.map((row) => {
      const off = Math.min(row.amount, Math.round((row.amount * pct) / 100));
      return { ...row, amount: row.amount - off, discount: off };
    });
  }
  let remaining = discount.value;
  return schedule.map((row) => {
    const off = Math.min(row.amount, remaining);
    remaining -= off;
    return { ...row, amount: row.amount - off, discount: off };
  });
}

/** Due day in the bill's start month (clamped), never before the bill starts. */
function previewDueDate(start: Date, paymentDueDay: number): Date {
  const day = Math.min(Math.max(1, paymentDueDay), daysInMonth(start));
  const due = new Date(start.getFullYear(), start.getMonth(), day);
  return due < start ? start : due;
}

/**
 * Frontend mirror of the backend schedule (lib/billing-schedule.ts) for the
 * new-lease preview: monthly = one bill per calendar month (mid-month
 * move-in: short first bill, or merged into the first full month);
 * upfront = one bill. The server is the source of truth.
 */
export function previewInvoiceSchedule(input: {
  startDate: Date;
  endDate: Date;
  monthlyPrice: number;
  dailyRate?: number | null;
  billingCycle: BillingCycle;
  firstPeriodMode: FirstPeriodMode;
  paymentDueDay: number;
}): PreviewInvoice[] {
  const { startDate, endDate, monthlyPrice, dailyRate, paymentDueDay } = input;
  if (input.billingCycle === "upfront") {
    return [
      {
        periodStart: startDate,
        periodEnd: endDate,
        amount: computeLeaseAmount(startDate, endDate, monthlyPrice, dailyRate)
          .amountDue,
        dueDate: previewDueDate(startDate, paymentDueDay),
      },
    ];
  }

  const periods: PreviewInvoice[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    const monthEnd = endOfMonth(cursor);
    const periodEnd = monthEnd < endDate ? monthEnd : endDate;
    periods.push({
      periodStart: cursor,
      periodEnd,
      amount: computeLeaseAmount(cursor, periodEnd, monthlyPrice, dailyRate)
        .amountDue,
      dueDate: previewDueDate(cursor, paymentDueDay),
    });
    cursor = new Date(
      periodEnd.getFullYear(),
      periodEnd.getMonth(),
      periodEnd.getDate() + 1,
    );
  }

  const [first, second, ...rest] = periods;
  if (
    input.firstPeriodMode === "merged" &&
    startDate.getDate() !== 1 &&
    first &&
    second
  ) {
    return [
      {
        periodStart: first.periodStart,
        periodEnd: second.periodEnd,
        amount: first.amount + second.amount,
        dueDate: first.dueDate,
      },
      ...rest,
    ];
  }
  return periods;
}

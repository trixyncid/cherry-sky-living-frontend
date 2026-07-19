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
  stubDays: number;
  dailyRate: number;
  fullMonths: number;
};

export function computeLeaseAmount(
  startDate: Date,
  endDate: Date,
  monthlyPrice: number,
  dailyRate?: number | null,
): LeaseAmountBreakdown {
  if (endDate < startDate) {
    throw new Error("endDate must be on or after startDate");
  }
  if (!isLastDayOfMonth(endDate)) {
    throw new Error("endDate must be the last day of a calendar month");
  }

  const monthCount = inclusiveMonthCount(startDate, endDate);

  if (startDate.getDate() === 1) {
    return {
      amountDue: monthCount * monthlyPrice,
      stubDays: 0,
      dailyRate: 0,
      fullMonths: monthCount,
    };
  }

  if (dailyRate == null || dailyRate <= 0) {
    throw new Error(
      "A 1-day pricing package is required for mid-month move-in. Set a daily price under Pricing.",
    );
  }

  const daysInStartMonth = daysInMonth(startDate);
  const stubDays = daysInStartMonth - startDate.getDate() + 1;
  const fullMonths = monthCount - 1;

  return {
    amountDue: stubDays * dailyRate + fullMonths * monthlyPrice,
    stubDays,
    dailyRate,
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

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

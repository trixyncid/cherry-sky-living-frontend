import { describe, expect, test } from "bun:test";
import {
  applyLeaseDiscount,
  fullMonthsEndDate,
  previewInvoiceSchedule,
} from "./billing";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const key = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
const base = {
  monthlyPrice: 1_500_000,
  dailyRate: 50_000,
  paymentDueDay: 5,
  firstPeriodMode: "separate" as const,
  billingCycle: "monthly" as const,
};
const rows = (r: ReturnType<typeof previewInvoiceSchedule>) =>
  r.map((x) => [
    key(x.periodStart),
    key(x.periodEnd),
    x.amount,
    key(x.dueDate),
  ]);

// Same cases as the backend (lib/billing-schedule.test.ts) so the preview
// matches what the server will create.
describe("previewInvoiceSchedule", () => {
  test("monthly from the 1st", () => {
    expect(
      rows(
        previewInvoiceSchedule({
          ...base,
          startDate: d(2026, 10, 1),
          endDate: d(2026, 12, 31),
        }),
      ),
    ).toEqual([
      ["2026-10-01", "2026-10-31", 1_500_000, "2026-10-05"],
      ["2026-11-01", "2026-11-30", 1_500_000, "2026-11-05"],
      ["2026-12-01", "2026-12-31", 1_500_000, "2026-12-05"],
    ]);
  });

  test("mid-month separate → short first bill due on move-in day", () => {
    expect(
      rows(
        previewInvoiceSchedule({
          ...base,
          startDate: d(2026, 10, 15),
          endDate: d(2026, 12, 31),
        }),
      )[0],
    ).toEqual(["2026-10-15", "2026-10-31", 17 * 50_000, "2026-10-15"]);
  });

  test("mid-month merged → stub folded into the first full month", () => {
    expect(
      rows(
        previewInvoiceSchedule({
          ...base,
          firstPeriodMode: "merged",
          startDate: d(2026, 10, 15),
          endDate: d(2026, 12, 31),
        }),
      ),
    ).toEqual([
      ["2026-10-15", "2026-11-30", 17 * 50_000 + 1_500_000, "2026-10-15"],
      ["2026-12-01", "2026-12-31", 1_500_000, "2026-12-05"],
    ]);
  });

  test("upfront → one bill", () => {
    expect(
      rows(
        previewInvoiceSchedule({
          ...base,
          billingCycle: "upfront",
          startDate: d(2026, 10, 1),
          endDate: d(2026, 12, 31),
        }),
      ),
    ).toEqual([["2026-10-01", "2026-12-31", 4_500_000, "2026-10-05"]]);
  });
});

describe("applyLeaseDiscount (preview mirror)", () => {
  const bills = () =>
    previewInvoiceSchedule({
      startDate: new Date(2026, 9, 1),
      endDate: new Date(2026, 11, 31),
      monthlyPrice: 1_500_000,
      dailyRate: 50_000,
      billingCycle: "monthly",
      firstPeriodMode: "separate",
      paymentDueDay: 5,
    });

  test("percent comes off every bill", () => {
    const rows = applyLeaseDiscount(bills(), { type: "percent", value: 10 });
    expect(rows.map((r) => r.amount)).toEqual([
      1_350_000, 1_350_000, 1_350_000,
    ]);
  });

  test("Rupiah comes off the earliest bills first", () => {
    const rows = applyLeaseDiscount(bills(), {
      type: "amount",
      value: 2_000_000,
    });
    expect(rows.map((r) => r.amount)).toEqual([0, 1_000_000, 1_500_000]);
    expect(rows.map((r) => r.discount)).toEqual([1_500_000, 500_000, 0]);
  });
});

describe("fullMonthsEndDate", () => {
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  test("ends the night before the same day N months later", () => {
    expect(ymd(fullMonthsEndDate(new Date(2026, 10, 27), 1))).toBe(
      "2026-12-26",
    );
    expect(ymd(fullMonthsEndDate(new Date(2026, 10, 27), 3))).toBe("2027-2-26");
    expect(ymd(fullMonthsEndDate(new Date(2026, 10, 1), 1))).toBe("2026-11-30");
    expect(ymd(fullMonthsEndDate(new Date(2026, 11, 1), 12))).toBe(
      "2027-11-30",
    );
  });
  test("clamps when the start day is missing in the target month", () => {
    expect(ymd(fullMonthsEndDate(new Date(2027, 0, 31), 1))).toBe("2027-2-28");
  });
});

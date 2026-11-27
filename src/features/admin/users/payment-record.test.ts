import { expect, test } from "bun:test";
import { paymentRecord } from "./payment-record";

const bill = (over: Record<string, unknown>) =>
  ({
    dueDate: "2026-10-05T00:00:00.000Z",
    status: "paid",
    paidAt: "2026-10-03T00:00:00.000Z",
    lateFeeWaived: false,
    ...over,
  }) as never;

test("counts late, overdue and waived bills; ignores future ones", () => {
  const record = paymentRecord(
    [
      {
        invoices: [
          bill({}), // on time
          // Due 5 Oct (Jakarta midnight), paid on 5 Oct afternoon: on time.
          bill({
            dueDate: "2026-10-04T17:00:00.000Z",
            paidAt: "2026-10-05T07:00:00.000Z",
          }),
          bill({ paidAt: "2026-10-09T00:00:00.000Z" }), // paid 4 days late
          bill({
            paidAt: "2026-11-27T00:00:00.000Z",
            dueDate: "2026-11-05T00:00:00.000Z",
            lateFeeWaived: true,
            lateFeeWaivedAmount: 440000,
          }),
          bill({
            status: "unpaid",
            paidAt: null,
            dueDate: "2026-11-20T00:00:00.000Z",
          }), // overdue
          bill({
            status: "unpaid",
            paidAt: null,
            dueDate: "2026-12-05T00:00:00.000Z",
          }), // not due yet
        ],
      },
    ],
    new Date("2026-11-27T12:00:00.000Z"),
  );
  expect(record).toEqual({ bills: 5, late: 3, waived: 1, waivedTotal: 440000 });
});

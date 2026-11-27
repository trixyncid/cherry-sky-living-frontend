import { expect, test } from "bun:test";
import { describeAction } from "./activity-log";

test("describeAction picks the action word or the HTTP method", () => {
  expect(describeAction("POST /admin/leases/:id/invoices/confirm")).toEqual({
    verb: "confirm",
    thing: "invoices",
  });
  expect(describeAction("DELETE /admin/units/:id")).toEqual({
    verb: "DELETE",
    thing: "units",
  });
  expect(describeAction("PATCH /admin/staff/:id/reset-password")).toEqual({
    verb: "reset-password",
    thing: "staff",
  });
});

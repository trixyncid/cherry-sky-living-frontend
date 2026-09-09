import { describe, expect, test } from "bun:test";
import {
  buildLeaseInvoice,
  leaseInvoiceFileName,
} from "@/features/admin/leases/build-lease-invoice";
import type { Lease } from "@/lib/types/admin";

function lease(overrides: Partial<Lease> = {}): Lease {
  return {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    status: "unpaid",
    startDate: "2026-09-01T00:00:00.000Z",
    endDate: "2026-09-30T00:00:00.000Z",
    amountDue: 1_500_000,
    paymentDueDay: 5,
    lateFeePerDay: 25_000,
    paymentDueDate: "2026-09-05T00:00:00.000Z",
    daysLate: 2,
    lateFeeAmount: 50_000,
    unitId: "unit_1",
    userId: "user_1",
    propertyId: "prop_1",
    unitPricingId: "pricing_1",
    createdById: "admin_1",
    updatedById: "admin_1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    user: {
      id: "user_1",
      name: "Ayu Wijaya",
      email: "ayu@example.com",
    },
    unit: {
      id: "unit_1",
      name: "A-01",
      maxOccupancy: 1,
      status: "occupied",
      propertyId: "prop_1",
      unitTypeId: "type_1",
      createdById: "admin_1",
      updatedById: "admin_1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      property: {
        id: "prop_1",
        name: "Skykost Medan",
        address: "Jl. Gaharu No. 12",
        city: "Medan",
        createdById: "admin_1",
        updatedById: "admin_1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      unitType: {
        id: "type_1",
        name: "Standard",
        description: null,
        size: null,
        propertyId: "prop_1",
        createdById: "admin_1",
        updatedById: "admin_1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
    ...overrides,
  };
}

const labels = {
  brandName: "Cherry Sky Living",
  brandAddressLines: ["Address 1", "Address 2"],
  brandEmail: "info@example.com",
  brandPhone: "+62 811",
  rentLineLabel: "Lease rent",
  rentLineDescription: "Billed amount",
  lateFeeLineLabel: "Late fee",
  lateFeeLineDescription: ({ days, perDay }: { days: number; perDay: string }) =>
    `${days} × ${perDay}`,
  statusPaid: "Paid",
  statusUnpaid: "Unpaid",
  statusWaitingForReview: "Waiting for review",
  notePaid: "Paid note",
  noteDue: "Due note",
  noteReview: "Review note",
  noteOverdue: ({ days }: { days: number }) => `Overdue ${days}`,
  formatMoney: (amount: number) => `Rp ${amount}`,
  formatDate: (value: string) => value.slice(0, 10),
};

describe("buildLeaseInvoice", () => {
  test("includes rent and late fee in total for unpaid leases", () => {
    const invoice = buildLeaseInvoice(
      lease(),
      labels,
      new Date("2026-09-07T00:00:00.000Z"),
    );

    expect(invoice.invoiceNumber).toBe("INV-AAAAAAAA-20260907");
    expect(invoice.statusTone).toBe("due");
    expect(invoice.lines).toHaveLength(2);
    expect(invoice.rentAmount).toBe(1_500_000);
    expect(invoice.lateFeeAmount).toBe(50_000);
    expect(invoice.totalAmount).toBe(1_550_000);
    expect(invoice.notes[0]).toContain("Overdue 2");
    expect(invoice.tenantName).toBe("Ayu Wijaya");
    expect(invoice.propertyName).toBe("Skykost Medan");
  });

  test("keeps late fee while waiting for review", () => {
    const invoice = buildLeaseInvoice(
      lease({ status: "waiting_for_review" }),
      labels,
    );

    expect(invoice.statusTone).toBe("review");
    expect(invoice.lateFeeAmount).toBe(50_000);
    expect(invoice.totalAmount).toBe(1_550_000);
    expect(invoice.notes[0]).toBe("Review note");
  });

  test("omits late fee for paid leases", () => {
    const invoice = buildLeaseInvoice(
      lease({
        status: "paid",
        daysLate: 4,
        lateFeeAmount: 100_000,
      }),
      labels,
    );

    expect(invoice.statusTone).toBe("paid");
    expect(invoice.lines).toHaveLength(1);
    expect(invoice.lateFeeAmount).toBe(0);
    expect(invoice.totalAmount).toBe(1_500_000);
    expect(invoice.notes[0]).toBe("Paid note");
  });

  test("builds a safe download file name", () => {
    const invoice = buildLeaseInvoice(
      lease(),
      labels,
      new Date("2026-09-07T00:00:00.000Z"),
    );
    expect(leaseInvoiceFileName(invoice)).toBe(
      "INV-AAAAAAAA-20260907-Ayu-Wijaya.pdf",
    );
  });
});

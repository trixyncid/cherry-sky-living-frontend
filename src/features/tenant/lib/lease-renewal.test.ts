import { beforeEach, describe, expect, test } from "bun:test";
import type { Lease, LeaseRenewal } from "@/lib/types/admin";
import {
  canRequestLeaseRenewal,
  clearRenewalDismissal,
  dismissRenewalPrompt,
  getTenantRenewalDisplayStatus,
  getTenantRenewalView,
  hasLeaseRenewal,
  isInFinalFiveDaysBeforeEnd,
  isRenewalDismissed,
} from "./lease-renewal";

const memoryStore = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, String(value));
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
    clear: () => memoryStore.clear(),
  },
  configurable: true,
});

Object.defineProperty(globalThis, "window", {
  value: globalThis,
  configurable: true,
});

function renewal(overrides: Partial<LeaseRenewal> = {}): LeaseRenewal {
  return {
    id: "rnw_1",
    leaseId: "lease_1",
    isRenewLease: false,
    isConfirmed: false,
    markAsCompleted: false,
    confirmationDeadline: "2026-09-24T17:00:00.000Z",
    updatedById: "admin_1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function lease(overrides: Partial<Lease> = {}): Lease {
  return {
    id: "lease_1",
    status: "paid",
    startDate: "2026-09-01T00:00:00.000Z",
    endDate: "2026-09-30T00:00:00.000Z",
    amountDue: 2_000_000,
    paymentDueDay: 5,
    lateFeePerDay: 100_000,
    unitId: "unit_1",
    userId: "tenant_1",
    propertyId: "prop_1",
    unitPricingId: "pricing_1",
    createdById: "admin_1",
    updatedById: "admin_1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    leaseRenewal: renewal(),
    ...overrides,
  };
}

describe("tenant lease renewal helpers", () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  test("canRequestLeaseRenewal requires paid lease with open renewal", () => {
    expect(canRequestLeaseRenewal(lease())).toBe(true);
    expect(canRequestLeaseRenewal(lease({ status: "unpaid" }))).toBe(false);
    expect(canRequestLeaseRenewal(lease({ leaseRenewal: null }))).toBe(false);
    expect(
      canRequestLeaseRenewal(
        lease({ leaseRenewal: renewal({ markAsCompleted: true }) }),
      ),
    ).toBe(false);
  });

  test("getTenantRenewalView covers prompt → requested → confirmed → none", () => {
    expect(getTenantRenewalView(lease())).toBe("prompt");
    expect(
      getTenantRenewalView(
        lease({ leaseRenewal: renewal({ isRenewLease: true }) }),
      ),
    ).toBe("requested");
    expect(
      getTenantRenewalView(
        lease({
          leaseRenewal: renewal({ isRenewLease: true, isConfirmed: true }),
        }),
      ),
    ).toBe("confirmed");
    expect(
      getTenantRenewalView(
        lease({
          leaseRenewal: renewal({ isRenewLease: false, isConfirmed: true }),
        }),
      ),
    ).toBe("none");
    expect(
      getTenantRenewalView(
        lease({ leaseRenewal: renewal({ markAsCompleted: true }) }),
      ),
    ).toBe("none");
  });

  test("dismissing the prompt hides it until cleared", () => {
    dismissRenewalPrompt("rnw_1");
    expect(isRenewalDismissed("rnw_1")).toBe(true);
    expect(getTenantRenewalView(lease())).toBe("none");
    clearRenewalDismissal("rnw_1");
    expect(getTenantRenewalView(lease())).toBe("prompt");
  });

  test("getTenantRenewalDisplayStatus maps lifecycle states", () => {
    expect(getTenantRenewalDisplayStatus(lease())).toBe("action_needed");
    expect(
      getTenantRenewalDisplayStatus(
        lease({ leaseRenewal: renewal({ isRenewLease: true }) }),
      ),
    ).toBe("requested");
    expect(
      getTenantRenewalDisplayStatus(
        lease({
          leaseRenewal: renewal({ isRenewLease: true, isConfirmed: true }),
        }),
      ),
    ).toBe("confirmed");
    expect(
      getTenantRenewalDisplayStatus(
        lease({
          leaseRenewal: renewal({ isRenewLease: false, isConfirmed: true }),
        }),
      ),
    ).toBe("declined");
    expect(
      getTenantRenewalDisplayStatus(
        lease({ leaseRenewal: renewal({ markAsCompleted: true }) }),
      ),
    ).toBe("completed");
    expect(
      getTenantRenewalDisplayStatus(lease({ status: "unpaid" })),
    ).toBe("not_eligible");
    expect(getTenantRenewalDisplayStatus(lease({ leaseRenewal: null }))).toBe(
      null,
    );
  });

  test("isInFinalFiveDaysBeforeEnd uses deadline and lease end", () => {
    // Today is 2026-09-06 (test environment date) — before the Sept 24 deadline.
    expect(
      isInFinalFiveDaysBeforeEnd(
        "2026-09-24T17:00:00.000Z",
        "2026-09-30T00:00:00.000Z",
      ),
    ).toBe(false);

    // Deadline already passed but lease still active.
    expect(
      isInFinalFiveDaysBeforeEnd(
        "2026-09-01T00:00:00.000Z",
        "2026-09-30T00:00:00.000Z",
      ),
    ).toBe(true);

    // Lease already ended.
    expect(
      isInFinalFiveDaysBeforeEnd(
        "2026-08-01T00:00:00.000Z",
        "2026-08-31T00:00:00.000Z",
      ),
    ).toBe(true);
  });

  test("hasLeaseRenewal", () => {
    expect(hasLeaseRenewal(lease())).toBe(true);
    expect(hasLeaseRenewal(lease({ leaseRenewal: null }))).toBe(false);
  });
});

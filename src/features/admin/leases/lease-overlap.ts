import { getLeaseEndDateValue } from "@/features/admin/lib/entity-display";
import type { Lease } from "@/lib/types/admin";

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

/**
 * True when ranges share any day. Back-to-back leases (new start = prior end) do not overlap.
 */
export function leaseDateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const aStart = toDateOnly(startA);
  const aEnd = toDateOnly(endA);
  const bStart = toDateOnly(startB);
  const bEnd = toDateOnly(endB);
  return bStart < aEnd && aStart < bEnd;
}

export type LeaseOverlapKind = "unit" | "tenant";

export type LeaseOverlapConflict = {
  kind: LeaseOverlapKind;
  lease: Lease;
};

type FindLeaseOverlapConflictsInput = {
  startDate: string;
  endDate: string;
  unitId: string;
  userId: string;
  unitLeases: Lease[];
  tenantLeases: Lease[];
  excludeLeaseIds?: string[];
  excludeRenewalId?: string;
};

function isLeaseExcluded(
  lease: Lease,
  excludeLeaseIds: string[],
  excludeRenewalId?: string,
): boolean {
  if (excludeLeaseIds.includes(lease.id)) return true;
  if (excludeRenewalId && lease.leaseRenewal?.id === excludeRenewalId) {
    return true;
  }
  return false;
}

function findOverlappingLease(
  leases: Lease[],
  startDate: string,
  endDate: string,
  excludeLeaseIds: string[],
  excludeRenewalId?: string,
): Lease | undefined {
  return leases.find((lease) => {
    if (isLeaseExcluded(lease, excludeLeaseIds, excludeRenewalId)) return false;
    const leaseEnd = getLeaseEndDateValue(lease);
    if (!leaseEnd) return false;
    return leaseDateRangesOverlap(
      startDate,
      endDate,
      lease.startDate,
      leaseEnd,
    );
  });
}

export function findLeaseOverlapConflicts(
  input: FindLeaseOverlapConflictsInput,
): LeaseOverlapConflict[] {
  const {
    startDate,
    endDate,
    unitId,
    userId,
    unitLeases,
    tenantLeases,
    excludeLeaseIds = [],
    excludeRenewalId,
  } = input;

  if (!startDate || !endDate) return [];

  const conflicts: LeaseOverlapConflict[] = [];

  const unitConflict = findOverlappingLease(
    unitLeases.filter((lease) => lease.unitId === unitId),
    startDate,
    endDate,
    excludeLeaseIds,
    excludeRenewalId,
  );
  if (unitConflict) {
    conflicts.push({ kind: "unit", lease: unitConflict });
  }

  const tenantConflict = findOverlappingLease(
    tenantLeases.filter(
      (lease) => lease.userId === userId && lease.unitId !== unitId,
    ),
    startDate,
    endDate,
    excludeLeaseIds,
    excludeRenewalId,
  );
  if (tenantConflict) {
    conflicts.push({ kind: "tenant", lease: tenantConflict });
  }

  return conflicts;
}

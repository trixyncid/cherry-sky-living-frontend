import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import { contactSummary } from "@/lib/phone";
import type {
  Lease,
  Property,
  Unit,
  UnitPricing,
  UnitType,
} from "@/lib/types/admin";

export const ADMIN_EMPTY = "—";

type PropertyLike = Pick<Property, "id" | "name" | "city"> | null | undefined;

export function resolvePropertyName(
  sources: {
    property?: PropertyLike;
    propertyId?: string | null;
  },
  lookups?: AdminLookups,
): string {
  if (sources.property?.name) return sources.property.name;
  if (sources.propertyId) {
    const fromLookup = lookups?.propertyById.get(sources.propertyId)?.name;
    if (fromLookup) return fromLookup;
  }
  return ADMIN_EMPTY;
}

export function resolveUnitTypeName(
  sources: {
    unitType?: Pick<UnitType, "name"> | null;
    unitTypeId?: string;
  },
  lookups?: AdminLookups,
): string {
  if (sources.unitType?.name) return sources.unitType.name;
  if (sources.unitTypeId) {
    const fromLookup = lookups?.unitTypeById.get(sources.unitTypeId)?.name;
    if (fromLookup) return fromLookup;
  }
  return ADMIN_EMPTY;
}

export function resolveLeasePropertyName(
  lease: Lease,
  lookups?: AdminLookups,
): string {
  return resolvePropertyName(
    {
      property: lease.property ?? lease.unit?.property,
      propertyId: lease.propertyId,
    },
    lookups,
  );
}

export function resolveUnitPropertyName(
  unit: Unit,
  lookups?: AdminLookups,
): string {
  return resolvePropertyName(
    {
      property: unit.property ?? unit.unitType?.property,
      propertyId: unit.propertyId,
    },
    lookups,
  );
}

export function resolveUnitTypeNameForUnit(
  unit: Unit,
  lookups?: AdminLookups,
): string {
  return resolveUnitTypeName(
    { unitType: unit.unitType, unitTypeId: unit.unitTypeId },
    lookups,
  );
}

export function resolvePricingUnitTypeName(
  row: UnitPricing,
  lookups?: AdminLookups,
): string {
  return resolveUnitTypeName(
    { unitType: row.unitType, unitTypeId: row.unitTypeId },
    lookups,
  );
}

export function resolvePricingPropertyName(
  row: UnitPricing,
  lookups?: AdminLookups,
): string {
  return resolvePropertyName(
    {
      property: row.property ?? row.unitType?.property,
      propertyId: row.propertyId,
    },
    lookups,
  );
}

export function resolveUnitTypePropertyName(
  row: UnitType,
  lookups?: AdminLookups,
): string {
  return resolvePropertyName(
    { property: row.property, propertyId: row.propertyId },
    lookups,
  );
}

export function resolveLeaseTenantLabel(lease: Lease): string {
  return lease.user?.name || contactSummary(lease.user) || lease.userId;
}

export function resolveUnitTenantLabel(unit: Unit): string {
  const lease = unit.activeLease;
  if (!lease) return ADMIN_EMPTY;
  return (
    lease.user?.name ||
    contactSummary(lease.user) ||
    lease.userId ||
    ADMIN_EMPTY
  );
}

/** Backend computes endDate; derive from pricing when missing in list payloads. */
export function getLeaseEndDateValue(lease: Lease): string | null {
  if (lease.endDate) return lease.endDate;
  const days = lease.unitPricing?.durationDays;
  if (!lease.startDate || days == null) return null;
  const [y, m, d] = lease.startDate.slice(0, 10).split("-").map(Number);
  const end = new Date(y, m - 1, d);
  end.setDate(end.getDate() + days);
  return end.toISOString();
}

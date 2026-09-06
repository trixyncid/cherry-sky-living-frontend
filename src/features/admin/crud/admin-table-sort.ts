import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import type { SortValue } from "@/features/admin/crud/sort-utils";
import { countPropertyAttachments, countUnitTypeAttachments } from "@/features/admin/lib/attachments";
import {
  getLeaseEndDateValue,
  resolveLeasePropertyName,
  resolveLeaseTenantLabel,
  resolvePricingPropertyName,
  resolvePricingUnitTypeName,
  resolveUnitPropertyName,
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
  resolveUnitTypePropertyName,
} from "@/features/admin/lib/entity-display";
import type {
  Lease,
  LedgerEntry,
  Property,
  StaffUser,
  TenantUser,
  Unit,
  UnitPricing,
  UnitType,
} from "@/lib/types/admin";

type LeaseRenewalSortStatus =
  | "not_requested"
  | "pending_confirmation"
  | "confirmed"
  | "completed";

function resolveRenewalSortStatus(lease: Lease): LeaseRenewalSortStatus {
  const renewal = lease.leaseRenewal;
  if (!renewal?.isRenewLease) return "not_requested";
  if (renewal.markAsCompleted) return "completed";
  if (renewal.isConfirmed) return "confirmed";
  return "pending_confirmation";
}

export function getPropertySortValue(property: Property, key: string): SortValue {
  switch (key) {
    case "name":
      return property.name;
    case "address":
      return property.address;
    case "city":
      return property.city;
    case "attachments":
      return countPropertyAttachments(property);
    default:
      return "";
  }
}

export function getUnitTypeSortValue(
  row: UnitType,
  key: string,
  lookups?: AdminLookups,
): SortValue {
  switch (key) {
    case "name":
      return row.name;
    case "property":
      return resolveUnitTypePropertyName(row, lookups);
    case "size":
      return row.size ?? -1;
    case "units":
      return row._count?.units ?? 0;
    case "attachments":
      return countUnitTypeAttachments(row);
    default:
      return "";
  }
}

export function getUnitSortValue(
  unit: Unit,
  key: string,
  lookups?: AdminLookups,
): SortValue {
  switch (key) {
    case "name":
      return unit.name;
    case "unitType":
      return resolveUnitTypeNameForUnit(unit, lookups);
    case "property":
      return resolveUnitPropertyName(unit, lookups);
    case "maxOccupancy":
      return unit.maxOccupancy ?? -1;
    case "tenant":
      return resolveUnitTenantLabel(unit);
    case "status":
      return unit.status;
    default:
      return "";
  }
}

export function getPricingSortValue(
  row: UnitPricing,
  key: string,
  lookups?: AdminLookups,
): SortValue {
  switch (key) {
    case "unitType":
      return resolvePricingUnitTypeName(row, lookups);
    case "property":
      return resolvePricingPropertyName(row, lookups);
    case "duration":
      return row.durationDays;
    case "price":
      return row.price;
    default:
      return "";
  }
}

export function getLeaseSortValue(
  lease: Lease,
  key: string,
  lookups?: AdminLookups,
): SortValue {
  switch (key) {
    case "unit":
      return lease.unit?.name ?? lease.unitId;
    case "tenant":
      return resolveLeaseTenantLabel(lease);
    case "period":
      return lease.startDate;
    case "status":
      return lease.status;
    case "rent":
      return lease.unitPricing?.price ?? 0;
    case "leaseEnd":
      return getLeaseEndDateValue(lease) ?? "";
    case "deadline":
      return lease.leaseRenewal?.confirmationDeadline ?? "";
    default:
      return resolveLeasePropertyName(lease, lookups);
  }
}

export function getLeaseRenewalSortValue(
  lease: Lease,
  key: string,
  lookups?: AdminLookups,
): SortValue {
  if (key === "status") return resolveRenewalSortStatus(lease);
  return getLeaseSortValue(lease, key, lookups);
}

export function getLedgerEntrySortValue(entry: LedgerEntry, key: string): SortValue {
  switch (key) {
    case "date":
      return entry.date;
    case "type":
      return entry.type;
    case "description":
      return entry.description;
    case "property":
      return entry.property?.name ?? "";
    case "category":
      return entry.category ?? "";
    case "amount":
      return entry.amount;
    default:
      return "";
  }
}

export function getTenantLeaseSortValue(lease: Lease, key: string): SortValue {
  switch (key) {
    case "unit":
      return lease.unit?.name ?? lease.unitId;
    case "period":
      return lease.startDate;
    case "status":
      return lease.status;
    case "rent":
      return lease.unitPricing?.price ?? 0;
    default:
      return "";
  }
}

export function getTenantUserSortValue(user: TenantUser, key: string): SortValue {
  switch (key) {
    case "name":
      return user.name;
    case "email":
      return user.email;
    case "status":
      return user.isActive ? 1 : 0;
    case "joined":
      return user.createdAt;
    default:
      return "";
  }
}

export function getStaffUserSortValue(user: StaffUser, key: string): SortValue {
  switch (key) {
    case "name":
      return user.name;
    case "email":
      return user.email;
    case "role":
      return user.role;
    case "status":
      return user.isActive ? 1 : 0;
    case "joined":
      return user.createdAt;
    default:
      return "";
  }
}

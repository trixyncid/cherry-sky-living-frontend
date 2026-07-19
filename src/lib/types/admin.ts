export type UnitStatus = "vacant" | "occupied";

export type LeaseStatus = "paid" | "unpaid" | "waiting_for_review";

export type LedgerEntryType = "income" | "expense";

export interface PropertyAttachment {
  id: string;
  propertyId: string;
  url: string;
  key?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UnitTypeAttachment {
  id: string;
  unitTypeId: string;
  url: string;
  key?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LeaseAttachmentKind = "agreement" | "downpayment" | "payment";

export interface LeaseAttachment {
  id: string;
  leaseId: string;
  kind: LeaseAttachmentKind;
  fileName?: string;
  url: string;
  objectKey?: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
}

/** @deprecated Use LeaseAttachment */
export type LeaseDownpaymentAttachment = LeaseAttachment;

export interface LedgerEntryAttachment {
  id: string;
  ledgerEntryId: string;
  fileName?: string;
  url: string;
  objectKey?: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  paymentDueDay?: number;
  lateFeePerDay?: number;
  renewalConfirmDaysBeforeEnd?: number;
  propertyAttachments?: PropertyAttachment[];
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    propertyAttachments?: number;
    unitTypes?: number;
    units?: number;
  };
}

export interface UnitType {
  id: string;
  name: string;
  description: string | null;
  size: number | null;
  propertyId: string;
  property?: Property;
  createdById: string;
  updatedById: string;
  unitTypeAttachments?: UnitTypeAttachment[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    units: number;
    pricings: number;
    unitTypeAttachments?: number;
  };
}

export interface UnitPricing {
  id: string;
  unitTypeId: string;
  propertyId: string;
  durationDays: number;
  price: number;
  unitType?: UnitType;
  property?: Property;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
  leases?: { id: string; status: LeaseStatus }[];
}

export interface UnitUserRef {
  id: string;
  name: string;
  email: string;
}

export interface TenantUser extends UnitUserRef {
  role: "tenant";
  isActive: boolean;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUserDetail extends TenantUser {
  leases?: Lease[];
}

export interface StaffUser extends UnitUserRef {
  role: "admin" | "superadmin";
  isActive: boolean;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResetTenantPasswordResult {
  user: TenantUser;
  temporaryPassword: string;
}

export interface ResetStaffPasswordResult {
  user: StaffUser;
  temporaryPassword: string;
}

export interface Unit {
  id: string;
  name: string;
  maxOccupancy: number | null;
  status: UnitStatus;
  unitTypeId: string;
  propertyId: string;
  property?: Property;
  unitType?: UnitType;
  activeLease?: Lease | null;
  leases?: Lease[];
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaseRenewal {
  id: string;
  leaseId: string;
  isRenewLease: boolean;
  isConfirmed: boolean;
  markAsCompleted: boolean;
  leaseEndDate: string;
  updatedById: string;
  updatedBy?: UnitUserRef;
  createdAt: string;
  updatedAt: string;
}

export interface Lease {
  id: string;
  status: LeaseStatus;
  startDate: string;
  endDate: string;
  amountDue: number;
  paymentDueDay: number;
  lateFeePerDay: number;
  /** ISO date — computed on read */
  paymentDueDate?: string;
  daysLate?: number;
  lateFeeAmount?: number;
  unitId: string;
  userId: string;
  propertyId: string;
  unitPricingId: string;
  property?: Property;
  unit?: Unit & { property?: Property; unitType?: UnitType };
  user?: UnitUserRef;
  unitPricing?: UnitPricing;
  leaseRenewal?: LeaseRenewal | null;
  attachments?: LeaseAttachment[];
  /** @deprecated Prefer attachments */
  downpaymentAttachments?: LeaseAttachment[];
  createdBy?: UnitUserRef;
  updatedBy?: UnitUserRef;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerSummary {
  income: number;
  expense: number;
  net: number;
}

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  propertyId: string | null;
  property?: Pick<Property, "id" | "name" | "city">;
  attachments?: LedgerEntryAttachment[];
  createdBy?: UnitUserRef;
  updatedBy?: UnitUserRef;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiLedgerListResponse {
  data: LedgerEntry[];
  summary?: LedgerSummary;
}

export interface ApiDataResponse<T> {
  data: T;
}

export function isUnitOccupied(status: UnitStatus | string): boolean {
  return status.toLowerCase() === "occupied";
}

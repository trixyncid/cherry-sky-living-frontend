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

export type LeaseAttachmentKind =
  | "agreement"
  | "downpayment"
  | "payment"
  /** Unit condition photos/report; tenants can upload these. */
  | "inspection";

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
  /** Refundable deposit (Rp) shown on the website; null = not set. */
  depositAmount?: number | null;
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
  /** Phone-only tenants have a placeholder email; see `contactSummary`. */
  email: string;
  phoneNumber?: string | null;
}

/** One of a person's numbers; the login one equals `phoneNumber`. */
export interface UserPhone {
  id: string;
  phoneNumber: string;
  label: string | null;
}

export type IdentityDocumentType = "ktp" | "passport";
/** pending = waiting for an admin; checked = confirmed; rejected = new photo needed. */
export type IdentityDocumentStatus = "pending" | "checked" | "rejected";

/** A tenant's KTP / passport photo; `url` is a short-lived signed link. */
export interface IdentityDocument {
  id: string;
  type: IdentityDocumentType;
  fileName: string;
  contentType: string | null;
  url: string | null;
  status: IdentityDocumentStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface TenantUser extends UnitUserRef {
  role: "tenant";
  /** Lists carry only the status; the detail page carries the file. */
  identityDocument?: Pick<IdentityDocument, "status" | "type"> | null;
  /** The number they sign in with (always one of `phones`). */
  phoneNumber: string | null;
  phoneNumberVerified?: boolean;
  phones?: UserPhone[];
  isActive: boolean;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUserDetail extends TenantUser {
  /** Leases where this tenant is the primary (billed) tenant. */
  leases?: Lease[];
  /** Leases where this tenant is a roommate. */
  leaseOccupancies?: { id: string; lease: Lease }[];
  identityDocument?: IdentityDocument | null;
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
  /** ISO datetime — tenant must confirm renew/decline by this deadline (not lease endDate). */
  confirmationDeadline: string;
  updatedById: string;
  updatedBy?: UnitUserRef;
  createdAt: string;
  updatedAt: string;
}

export type LeaseBillingCycle = "monthly" | "upfront";
export type LeasePaymentMethod = "bank_transfer" | "cash";

export type PettyCashEntryType =
  | "top_up"
  | "expense"
  | "cash_in"
  | "return_to_bank"
  | "adjustment";

/** Types a person records by hand (adjustments come from cash counts). */
export type ManualPettyCashType = Exclude<PettyCashEntryType, "adjustment">;

export interface PettyCashEntry {
  id: string;
  propertyId: string;
  type: PettyCashEntryType;
  /** Signed effect on the cash box: + money in, − money out. */
  amount: number;
  category: string | null;
  description: string;
  date: string;
  leaseId: string | null;
  invoiceId: string | null;
  reversedAt: string | null;
  voidReason: string | null;
  /** Box balance after this entry (list responses only). */
  balanceAfter?: number;
  property?: { id: string; name: string };
  invoice?: { id: string; sequence: number; leaseId: string } | null;
  attachments?: LedgerEntryAttachment[];
  createdBy?: UnitUserRef;
  createdAt: string;
  updatedAt: string;
}

export interface PettyCashSummary {
  balances: {
    propertyId: string;
    propertyName: string;
    balance: number;
    lastCountedAt: string | null;
  }[];
  totalBalance: number;
  moneyIn: number;
  moneyOut: number;
}
export type LeaseFirstPeriodMode = "separate" | "merged";
/** percent: off every bill · amount: Rupiah off the lease total. */
export type LeaseDiscountType = "amount" | "percent";
/** Same values as a lease used to have; now tracked per bill. */
export type LeaseInvoiceStatus = LeaseStatus;

/** One bill in a lease's payment schedule. */
export interface LeaseInvoice {
  id: string;
  leaseId: string;
  sequence: number;
  periodStart: string;
  /** Inclusive last day covered. */
  periodEnd: string;
  /** After discount. */
  amount: number;
  /** Taken off this bill by the lease discount. */
  discount?: number;
  dueDate: string;
  status: LeaseInvoiceStatus;
  paidAt: string | null;
  /** Set once paid; cash → booked in the property's petty cash. */
  paymentMethod?: LeasePaymentMethod | null;
  proofAttachmentId: string | null;
  proofAttachment?: LeaseAttachment | null;
  lateFeePerDay: number;
  lateFeeWaived: boolean;
  lateFeeWaiveReason: string | null;
  /** The fee and days late when it was waived (kept for the payment record). */
  lateFeeWaivedAmount?: number;
  lateFeeWaivedDays?: number;
  lateFeeCharged: number;
  /** Last change (e.g. when a receipt was sent for review). */
  updatedAt?: string;
  /** Computed on read. */
  daysLate: number;
  /** Accrued while unpaid; the charged amount once paid. */
  lateFeeAmount: number;
}

/**
 * Where the tenant stands today: overdue · review (receipt to check) · due
 * (due today) · current (paid so far, more bills to come) · paid (all bills)
 * · upcoming (nothing due yet).
 */
export type LeaseBillingState =
  | "overdue"
  | "review"
  | "due"
  | "current"
  | "paid"
  | "upcoming";

export interface LeaseBillingSummary {
  state: LeaseBillingState;
  invoiceCount: number;
  paidCount: number;
  paidAmount: number;
  /** Bills due today or earlier that are not paid. */
  outstandingAmount: number;
  overdueCount: number;
  lateFeeAccrued: number;
  nextInvoice: {
    id: string;
    sequence: number;
    amount: number;
    dueDate: string;
    status: LeaseInvoiceStatus;
  } | null;
}

/** A roommate sharing the unit with the lease's primary tenant. */
export interface LeaseOccupant {
  id: string;
  userId: string;
  user?: Pick<UnitUserRef, "id" | "name"> & Partial<UnitUserRef>;
  createdAt?: string;
}

export interface Lease {
  id: string;
  /** Mirrors the first (move-in) bill — drives occupancy. */
  status: LeaseStatus;
  billingCycle?: LeaseBillingCycle;
  firstPeriodMode?: LeaseFirstPeriodMode;
  discountType?: LeaseDiscountType | null;
  /** Rupiah for "amount", 1–100 for "percent". */
  discountValue?: number;
  discountNote?: string | null;
  invoices?: LeaseInvoice[];
  billing?: LeaseBillingSummary;
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
  /** Primary tenant: holds the contract, is billed, decides on renewal. */
  user?: UnitUserRef;
  /** Roommates sharing the unit (not billed). */
  occupants?: LeaseOccupant[];
  /** Tenant portal only: whether the viewer is the primary tenant. */
  isPrimaryTenant?: boolean;
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
  /** Set for auto-posted rent rows linked to a lease. */
  leaseId?: string | null;
  /** Set when a paid bill posted this row; the server refuses edits and deletes. */
  invoiceId?: string | null;
  /** Soft-void timestamp; excluded from income summaries when set. */
  reversedAt?: string | null;
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

export interface AdminDashboardLeaseSummary {
  id: string;
  status: LeaseStatus;
  /** For bill queue items: that bill's amount. */
  amountDue: number;
  /** Set on payment queue items (overdue / awaiting review). */
  invoice?: {
    id: string;
    sequence: number;
    status: LeaseInvoiceStatus;
    amount: number;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    lateFeeAmount: number;
  };
  startDate: string;
  endDate: string;
  propertyId: string;
  paymentDueDate?: string;
  daysLate?: number;
  property?: { id: string; name: string };
  unit?: { id: string; name: string };
  user?: UnitUserRef;
  leaseRenewal?: {
    id: string;
    isRenewLease: boolean;
    isConfirmed: boolean;
    markAsCompleted: boolean;
    confirmationDeadline: string;
  } | null;
}

export interface AdminDashboard {
  asOf: string;
  period: {
    start: string;
    endExclusive: string;
    label: string;
  };
  portfolio: {
    propertyCount: number;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyPercent: number;
  };
  collections: {
    accountsReceivable: number;
    awaitingReviewCount: number;
    awaitingReviewAmount: number;
    unpaidOverdueCount: number;
    unpaidOverdueAmount: number;
    monthIncome: number;
    monthExpense: number;
    monthNet: number;
    contractedActiveValue: number;
  };
  leases: {
    activePaid: number;
    expiringSoonCount: number;
    renewalPendingCount: number;
    renewalOverdueCount: number;
    renewalIntentRenew: number;
    renewalIntentDecline: number;
  };
  queues: {
    awaitingReview: AdminDashboardLeaseSummary[];
    unpaidOverdue: AdminDashboardLeaseSummary[];
    overdueRenewals: AdminDashboardLeaseSummary[];
    expiringSoon: AdminDashboardLeaseSummary[];
  };
  cashFlow: {
    months: {
      month: string;
      income: number;
      expense: number;
      net: number;
    }[];
  };
  revenueMix: { category: string; amount: number }[];
  expenseMix: { category: string; amount: number }[];
  vacancyByUnitType: {
    unitTypeId: string;
    unitTypeName: string;
    vacant: number;
    occupied: number;
    total: number;
  }[];
}

export function isUnitOccupied(status: UnitStatus | string): boolean {
  return status.toLowerCase() === "occupied";
}

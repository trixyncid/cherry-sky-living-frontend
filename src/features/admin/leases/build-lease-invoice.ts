import type { Lease } from "@/lib/types/admin";

export type LeaseInvoiceLine = {
  key: "rent" | "late_fee";
  label: string;
  description?: string;
  amount: number;
};

export type LeaseInvoiceStatusTone = "due" | "review" | "paid";

export type LeaseInvoiceModel = {
  invoiceNumber: string;
  issuedAt: Date;
  statusTone: LeaseInvoiceStatusTone;
  brandName: string;
  brandAddressLines: string[];
  brandEmail: string;
  brandPhone: string;
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  propertyAddress: string;
  unitName: string;
  unitTypeName: string | null;
  periodStart: string;
  periodEnd: string;
  paymentDueDate: string | null;
  daysLate: number;
  statusLabel: string;
  lines: LeaseInvoiceLine[];
  rentAmount: number;
  lateFeeAmount: number;
  totalAmount: number;
  notes: string[];
};

export type BuildLeaseInvoiceLabels = {
  brandName: string;
  brandAddressLines: string[];
  brandEmail: string;
  brandPhone: string;
  rentLineLabel: string;
  rentLineDescription: string;
  lateFeeLineLabel: string;
  lateFeeLineDescription: (args: {
    days: number;
    perDay: string;
  }) => string;
  statusPaid: string;
  statusUnpaid: string;
  statusWaitingForReview: string;
  notePaid: string;
  noteDue: string;
  noteReview: string;
  noteOverdue: (args: { days: number }) => string;
  formatMoney: (amount: number) => string;
  formatDate: (value: string) => string;
};

function shortLeaseRef(leaseId: string): string {
  return leaseId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function invoiceNumberFor(leaseId: string, issuedAt: Date): string {
  const y = issuedAt.getFullYear();
  const m = String(issuedAt.getMonth() + 1).padStart(2, "0");
  const d = String(issuedAt.getDate()).padStart(2, "0");
  return `INV-${shortLeaseRef(leaseId)}-${y}${m}${d}`;
}

function statusTone(status: Lease["status"]): LeaseInvoiceStatusTone {
  if (status === "paid") return "paid";
  if (status === "waiting_for_review") return "review";
  return "due";
}

/**
 * Builds a printable invoice model from a saved lease.
 * Late fees are included while status is unpaid or waiting_for_review.
 */
export function buildLeaseInvoice(
  lease: Lease,
  labels: BuildLeaseInvoiceLabels,
  issuedAt: Date = new Date(),
): LeaseInvoiceModel {
  const tone = statusTone(lease.status);
  const rentAmount = Math.max(0, lease.amountDue ?? 0);
  const lateFeeAmount =
    tone === "paid" ? 0 : Math.max(0, lease.lateFeeAmount ?? 0);
  const daysLate = tone === "paid" ? 0 : Math.max(0, lease.daysLate ?? 0);
  const totalAmount = rentAmount + lateFeeAmount;

  const property =
    lease.property ?? lease.unit?.property ?? undefined;
  const propertyName = property?.name?.trim() || "—";
  const propertyAddress = [property?.address, property?.city]
    .filter(Boolean)
    .join(", ");

  const lines: LeaseInvoiceLine[] = [
    {
      key: "rent",
      label: labels.rentLineLabel,
      description: labels.rentLineDescription,
      amount: rentAmount,
    },
  ];

  if (lateFeeAmount > 0) {
    lines.push({
      key: "late_fee",
      label: labels.lateFeeLineLabel,
      description: labels.lateFeeLineDescription({
        days: daysLate,
        perDay: labels.formatMoney(lease.lateFeePerDay ?? 0),
      }),
      amount: lateFeeAmount,
    });
  }

  const statusLabel =
    tone === "paid"
      ? labels.statusPaid
      : tone === "review"
        ? labels.statusWaitingForReview
        : labels.statusUnpaid;

  const notes: string[] = [];
  if (tone === "paid") {
    notes.push(labels.notePaid);
  } else if (tone === "review") {
    notes.push(labels.noteReview);
  } else if (daysLate > 0) {
    notes.push(labels.noteOverdue({ days: daysLate }));
  } else {
    notes.push(labels.noteDue);
  }

  return {
    invoiceNumber: invoiceNumberFor(lease.id, issuedAt),
    issuedAt,
    statusTone: tone,
    brandName: labels.brandName,
    brandAddressLines: labels.brandAddressLines,
    brandEmail: labels.brandEmail,
    brandPhone: labels.brandPhone,
    tenantName: lease.user?.name?.trim() || "—",
    tenantEmail: lease.user?.email?.trim() || "—",
    propertyName,
    propertyAddress: propertyAddress || "—",
    unitName: lease.unit?.name?.trim() || "—",
    unitTypeName: lease.unit?.unitType?.name?.trim() || null,
    periodStart: labels.formatDate(lease.startDate),
    periodEnd: labels.formatDate(lease.endDate),
    paymentDueDate: lease.paymentDueDate
      ? labels.formatDate(lease.paymentDueDate)
      : null,
    daysLate,
    statusLabel,
    lines,
    rentAmount,
    lateFeeAmount,
    totalAmount,
    notes,
  };
}

export function leaseInvoiceFileName(invoice: LeaseInvoiceModel): string {
  const safeTenant = invoice.tenantName
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const tenantPart = safeTenant || "tenant";
  return `${invoice.invoiceNumber}-${tenantPart}.pdf`;
}

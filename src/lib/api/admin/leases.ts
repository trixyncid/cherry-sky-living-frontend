import { apiFetch, apiFetchFormData } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ApiListResponse,
  Lease,
  LeaseAttachmentKind,
  LeaseBillingCycle,
  LeaseDiscountType,
  LeaseFirstPeriodMode,
  LeaseRenewal,
} from "@/lib/types/admin";

export async function listLeases(filters?: {
  unitId?: string;
  userId?: string;
  propertyId?: string;
}): Promise<Lease[]> {
  const params = new URLSearchParams();
  if (filters?.unitId) params.set("unitId", filters.unitId);
  if (filters?.userId) params.set("userId", filters.userId);
  if (filters?.propertyId) params.set("propertyId", filters.propertyId);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await apiFetch<ApiListResponse<Lease>>(`/admin/leases${query}`);
  return res.data;
}

export async function getLease(id: string): Promise<Lease> {
  const res = await apiFetch<ApiDataResponse<Lease>>(`/admin/leases/${id}`);
  return res.data;
}

export async function createLease(input: {
  unitId: string;
  userId: string;
  startDate: string;
  endDate: string;
  unitPricingId: string;
  leaseRenewalId?: string;
  billingCycle?: LeaseBillingCycle;
  firstPeriodMode?: LeaseFirstPeriodMode;
  discountType?: LeaseDiscountType | null;
  discountValue?: number;
  discountNote?: string | null;
  file?: File | null;
  attachmentKind?: LeaseAttachmentKind;
}): Promise<Lease> {
  const { file, attachmentKind, ...fields } = input;

  if (file) {
    const form = new FormData();
    form.set("unitId", fields.unitId);
    form.set("userId", fields.userId);
    form.set("startDate", fields.startDate);
    form.set("endDate", fields.endDate);
    form.set("unitPricingId", fields.unitPricingId);
    if (fields.leaseRenewalId) {
      form.set("leaseRenewalId", fields.leaseRenewalId);
    }
    if (fields.billingCycle) form.set("billingCycle", fields.billingCycle);
    if (fields.firstPeriodMode) {
      form.set("firstPeriodMode", fields.firstPeriodMode);
    }
    if (fields.discountType) {
      form.set("discountType", fields.discountType);
      form.set("discountValue", String(fields.discountValue ?? 0));
      if (fields.discountNote) form.set("discountNote", fields.discountNote);
    }
    form.set("attachmentKind", attachmentKind ?? "downpayment");
    form.set("file", file);

    const res = await apiFetchFormData<ApiDataResponse<Lease>>(
      "/admin/leases",
      form,
    );
    return res.data;
  }

  const res = await apiFetch<ApiDataResponse<Lease>>("/admin/leases", {
    method: "POST",
    body: fields,
  });
  return res.data;
}

export async function updateLease(
  id: string,
  input: Partial<{
    startDate: string;
    endDate: string;
    unitPricingId: string;
    allowPaidOverride: boolean;
    /** null clears the discount; only unpaid bills are repriced. */
    discountType: LeaseDiscountType | null;
    discountValue: number;
    discountNote: string | null;
  }>,
): Promise<Lease> {
  const res = await apiFetch<ApiDataResponse<Lease>>(`/admin/leases/${id}`, {
    method: "PUT",
    body: input,
  });
  return res.data;
}

/** Switch monthly ↔ up front / first-month handling (rebuilds unpaid bills). */
export async function updateLeaseBilling(
  id: string,
  input: {
    billingCycle?: LeaseBillingCycle;
    firstPeriodMode?: LeaseFirstPeriodMode;
  },
): Promise<Lease> {
  const res = await apiFetch<ApiDataResponse<Lease>>(
    `/admin/leases/${id}/billing`,
    { method: "PUT", body: input },
  );
  return res.data;
}

/** Confirm one or several bills as paid with one receipt. */
export async function confirmLeaseInvoices(
  id: string,
  input: {
    invoiceIds: string[];
    file?: File | null;
    proofAttachmentId?: string;
    /** Cash → booked in the property's petty cash (receipt optional). */
    paymentMethod?: "bank_transfer" | "cash";
    waiveLateFee?: boolean;
    waiveReason?: string;
  },
): Promise<Lease> {
  const { file, ...body } = input;
  if (file) {
    const form = new FormData();
    for (const invoiceId of body.invoiceIds)
      form.append("invoiceIds", invoiceId);
    if (body.proofAttachmentId) {
      form.set("proofAttachmentId", body.proofAttachmentId);
    }
    if (body.paymentMethod) form.set("paymentMethod", body.paymentMethod);
    if (body.waiveLateFee != null) {
      form.set("waiveLateFee", String(body.waiveLateFee));
    }
    if (body.waiveReason) form.set("waiveReason", body.waiveReason);
    form.set("file", file);
    const res = await apiFetchFormData<ApiDataResponse<Lease>>(
      `/admin/leases/${id}/invoices/confirm`,
      form,
    );
    return res.data;
  }
  const res = await apiFetch<ApiDataResponse<Lease>>(
    `/admin/leases/${id}/invoices/confirm`,
    { method: "POST", body },
  );
  return res.data;
}

/** Reject a payment (→ unpaid) or mark a receipt as received (→ in review). */
export async function setLeaseInvoicePending(
  id: string,
  invoiceId: string,
  status: "unpaid" | "waiting_for_review",
): Promise<Lease> {
  const res = await apiFetch<ApiDataResponse<Lease>>(
    `/admin/leases/${id}/invoices/${invoiceId}/pending`,
    { method: "POST", body: { status } },
  );
  return res.data;
}

export async function setLeaseInvoiceLateFeeWaiver(
  id: string,
  invoiceId: string,
  input: { waived: boolean; reason?: string },
): Promise<Lease> {
  const res = await apiFetch<ApiDataResponse<Lease>>(
    `/admin/leases/${id}/invoices/${invoiceId}/late-fee-waiver`,
    { method: "PUT", body: input },
  );
  return res.data;
}

export async function deleteLease(id: string): Promise<Lease> {
  const res = await apiFetch<ApiDataResponse<Lease>>(`/admin/leases/${id}`, {
    method: "DELETE",
  });
  return res.data;
}

export async function updateLeaseRenewal(
  leaseId: string,
  input: { isConfirmed: boolean },
): Promise<LeaseRenewal> {
  const res = await apiFetch<ApiDataResponse<LeaseRenewal>>(
    `/admin/leases/${leaseId}/renewal`,
    {
      method: "PUT",
      body: input,
    },
  );
  return res.data;
}

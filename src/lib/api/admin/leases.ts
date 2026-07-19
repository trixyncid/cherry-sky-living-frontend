import { apiFetch, apiFetchFormData } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ApiListResponse,
  Lease,
  LeaseAttachmentKind,
  LeaseRenewal,
  LeaseStatus,
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
    status: LeaseStatus;
  }>,
): Promise<Lease> {
  const res = await apiFetch<ApiDataResponse<Lease>>(`/admin/leases/${id}`, {
    method: "PUT",
    body: input,
  });
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

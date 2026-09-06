import { apiFetch } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ApiListResponse,
  Lease,
  LeaseRenewal,
} from "@/lib/types/admin";

export async function listTenantLeases(): Promise<Lease[]> {
  const res = await apiFetch<ApiListResponse<Lease>>("/leases");
  return res.data;
}

export async function getTenantLease(id: string): Promise<Lease> {
  const res = await apiFetch<ApiDataResponse<Lease>>(`/leases/${id}`);
  return res.data;
}

export async function updateTenantLeaseRenewal(
  leaseId: string,
  input: { action: "renew" | "decline" | "cancel" },
): Promise<LeaseRenewal> {
  const res = await apiFetch<ApiDataResponse<LeaseRenewal>>(
    `/leases/${leaseId}/renewal`,
    {
      method: "PUT",
      body: input,
    },
  );
  return res.data;
}

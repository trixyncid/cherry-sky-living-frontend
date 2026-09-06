import { apiFetch } from "@/lib/api/client";
import type { AdminDashboard, ApiDataResponse } from "@/lib/types/admin";

export async function getAdminDashboard(propertyId?: string): Promise<AdminDashboard> {
  const params = new URLSearchParams();
  if (propertyId) params.set("propertyId", propertyId);
  const query = params.toString();
  const res = await apiFetch<ApiDataResponse<AdminDashboard>>(
    `/admin/dashboard${query ? `?${query}` : ""}`,
  );
  return res.data;
}

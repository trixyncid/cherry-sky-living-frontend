import { apiFetch } from "@/lib/api/client";
import type { ApiDataResponse } from "@/lib/types/admin";
import type { TenantProfile } from "@/lib/types/tenant";

export async function getTenantProfile(): Promise<TenantProfile> {
  const res = await apiFetch<ApiDataResponse<TenantProfile>>("/profile");
  return res.data;
}

export async function updateTenantProfile(input: {
  name: string;
  phoneNumber: string;
}): Promise<TenantProfile> {
  const res = await apiFetch<ApiDataResponse<TenantProfile>>("/profile", {
    method: "PUT",
    body: input,
  });
  return res.data;
}

export async function changeTenantPassword(input: {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}): Promise<{ success: boolean }> {
  const res = await apiFetch<ApiDataResponse<{ success: boolean }>>(
    "/profile/password",
    {
      method: "PUT",
      body: input,
    },
  );
  return res.data;
}

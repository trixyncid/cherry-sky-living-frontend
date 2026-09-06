import { apiFetch } from "@/lib/api/client";
import type { ApiDataResponse } from "@/lib/types/admin";
import type { TenantProfile } from "@/lib/types/tenant";

export type AdminProfile = TenantProfile;

export async function getAdminProfile(): Promise<AdminProfile> {
  const res = await apiFetch<ApiDataResponse<AdminProfile>>("/profile");
  return res.data;
}

export async function updateAdminProfile(input: {
  name: string;
}): Promise<AdminProfile> {
  const res = await apiFetch<ApiDataResponse<AdminProfile>>("/profile", {
    method: "PUT",
    body: input,
  });
  return res.data;
}

export async function changeAdminPassword(input: {
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

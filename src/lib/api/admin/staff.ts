import { apiFetch } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ApiListResponse,
  ResetStaffPasswordResult,
  StaffUser,
} from "@/lib/types/admin";

export async function listStaffUsers(search?: string): Promise<StaffUser[]> {
  const query = search?.trim()
    ? `?${new URLSearchParams({ search: search.trim() })}`
    : "";
  const res = await apiFetch<ApiListResponse<StaffUser>>(
    `/admin/staff${query}`,
  );
  return res.data;
}

export async function getStaffUser(id: string): Promise<StaffUser> {
  const res = await apiFetch<ApiDataResponse<StaffUser>>(
    `/admin/staff/${id}`,
  );
  return res.data;
}

export async function createStaffUser(input: {
  name: string;
  email: string;
  password: string;
  role: StaffUser["role"];
}): Promise<StaffUser> {
  const res = await apiFetch<ApiDataResponse<StaffUser>>("/admin/staff", {
    method: "POST",
    body: input,
  });
  return res.data;
}

export async function updateStaffUser(
  id: string,
  input: Partial<Pick<StaffUser, "name" | "email" | "role">>,
): Promise<StaffUser> {
  const res = await apiFetch<ApiDataResponse<StaffUser>>(`/admin/staff/${id}`, {
    method: "PATCH",
    body: input,
  });
  return res.data;
}

export async function setStaffUserActive(
  id: string,
  isActive: boolean,
): Promise<StaffUser> {
  const res = await apiFetch<ApiDataResponse<StaffUser>>(
    `/admin/staff/${id}/active`,
    {
      method: "PATCH",
      body: { isActive },
    },
  );
  return res.data;
}

export async function resetStaffPassword(
  id: string,
): Promise<ResetStaffPasswordResult> {
  const res = await apiFetch<ApiDataResponse<ResetStaffPasswordResult>>(
    `/admin/staff/${id}/reset-password`,
    { method: "POST" },
  );
  return res.data;
}

export async function deleteStaffUser(id: string): Promise<StaffUser> {
  const res = await apiFetch<ApiDataResponse<StaffUser>>(
    `/admin/staff/${id}`,
    { method: "DELETE" },
  );
  return res.data;
}

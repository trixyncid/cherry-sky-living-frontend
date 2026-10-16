import { apiFetch } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ApiListResponse,
  ResetTenantPasswordResult,
  TenantUser,
  TenantUserDetail,
} from "@/lib/types/admin";

export async function listTenantUsers(search?: string): Promise<TenantUser[]> {
  const query = search?.trim()
    ? `?${new URLSearchParams({ search: search.trim() })}`
    : "";
  const res = await apiFetch<ApiListResponse<TenantUser>>(
    `/admin/users${query}`,
  );
  return res.data;
}

export async function getTenantUser(id: string): Promise<TenantUserDetail> {
  const res = await apiFetch<ApiDataResponse<TenantUserDetail>>(
    `/admin/users/${id}`,
  );
  return res.data;
}

export async function updateTenantUser(
  id: string,
  input: { name: string; phoneNumber: string; email?: string | null },
): Promise<TenantUser> {
  const res = await apiFetch<ApiDataResponse<TenantUser>>(`/admin/users/${id}`, {
    method: "PATCH",
    body: input,
  });
  return res.data;
}

export async function createTenantUser(input: {
  name: string;
  phoneNumber: string;
  email?: string;
  password: string;
}): Promise<TenantUser> {
  const res = await apiFetch<ApiDataResponse<TenantUser>>("/admin/users", {
    method: "POST",
    body: input,
  });
  return res.data;
}

export async function setTenantUserActive(
  id: string,
  isActive: boolean,
): Promise<TenantUser> {
  const res = await apiFetch<ApiDataResponse<TenantUser>>(
    `/admin/users/${id}/active`,
    {
      method: "PATCH",
      body: { isActive },
    },
  );
  return res.data;
}

export async function resetTenantPassword(
  id: string,
): Promise<ResetTenantPasswordResult> {
  const res = await apiFetch<ApiDataResponse<ResetTenantPasswordResult>>(
    `/admin/users/${id}/reset-password`,
    { method: "POST" },
  );
  return res.data;
}

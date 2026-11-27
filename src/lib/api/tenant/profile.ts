import { apiFetch, apiFetchFormData } from "@/lib/api/client";
import type { PhoneListPayload } from "@/lib/phone-list";
import type {
  ApiDataResponse,
  IdentityDocument,
  IdentityDocumentType,
} from "@/lib/types/admin";
import type { TenantProfile } from "@/lib/types/tenant";

export async function getTenantProfile(): Promise<TenantProfile> {
  const res = await apiFetch<ApiDataResponse<TenantProfile>>("/profile");
  return res.data;
}

export async function updateTenantProfile(
  input: { name: string; currentPassword?: string } & PhoneListPayload,
): Promise<TenantProfile> {
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

export async function getTenantIdentity(): Promise<IdentityDocument | null> {
  const res =
    await apiFetch<ApiDataResponse<IdentityDocument | null>>(
      "/profile/identity",
    );
  return res.data;
}

export async function uploadTenantIdentity(
  type: IdentityDocumentType,
  file: File,
): Promise<IdentityDocument> {
  const form = new FormData();
  form.set("type", type);
  form.set("file", file);
  const res = await apiFetchFormData<ApiDataResponse<IdentityDocument>>(
    "/profile/identity",
    form,
  );
  return res.data;
}

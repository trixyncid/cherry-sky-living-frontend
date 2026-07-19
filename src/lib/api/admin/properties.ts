import { apiFetch } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ApiListResponse,
  Property,
} from "@/lib/types/admin";

export async function listProperties(): Promise<Property[]> {
  const res = await apiFetch<ApiListResponse<Property>>("/admin/properties");
  return res.data;
}

export async function getProperty(id: string): Promise<Property> {
  const res = await apiFetch<ApiDataResponse<Property>>(
    `/admin/properties/${id}`,
  );
  return res.data;
}

export type PropertyPaymentInput = {
  name: string;
  address: string;
  city: string;
  paymentDueDay?: number;
  lateFeePerDay?: number;
  renewalConfirmDaysBeforeEnd?: number;
};

export async function createProperty(
  input: PropertyPaymentInput,
): Promise<Property> {
  const res = await apiFetch<ApiDataResponse<Property>>("/admin/properties", {
    method: "POST",
    body: input,
  });
  return res.data;
}

export async function updateProperty(
  id: string,
  input: Partial<PropertyPaymentInput>,
): Promise<Property> {
  const res = await apiFetch<ApiDataResponse<Property>>(
    `/admin/properties/${id}`,
    { method: "PUT", body: input },
  );
  return res.data;
}

export async function deleteProperty(id: string): Promise<Property> {
  const res = await apiFetch<ApiDataResponse<Property>>(
    `/admin/properties/${id}`,
    { method: "DELETE" },
  );
  return res.data;
}

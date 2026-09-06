import { apiFetch } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ApiListResponse,
  UnitPricing,
} from "@/lib/types/admin";

export async function listUnitPricings(filters?: {
  unitTypeId?: string;
  propertyId?: string;
}): Promise<UnitPricing[]> {
  const params = new URLSearchParams();
  if (filters?.unitTypeId) params.set("unitTypeId", filters.unitTypeId);
  if (filters?.propertyId) params.set("propertyId", filters.propertyId);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await apiFetch<ApiListResponse<UnitPricing>>(
    `/admin/unit-pricings${query}`,
  );
  return res.data;
}

export async function getUnitPricing(id: string): Promise<UnitPricing> {
  const res = await apiFetch<ApiDataResponse<UnitPricing>>(
    `/admin/unit-pricings/${id}`,
  );
  return res.data;
}

export async function createUnitPricing(input: {
  unitTypeId: string;
  durationDays: number;
  price: number;
}): Promise<UnitPricing> {
  const res = await apiFetch<ApiDataResponse<UnitPricing>>(
    "/admin/unit-pricings",
    { method: "POST", body: input },
  );
  return res.data;
}

export async function updateUnitPricing(
  id: string,
  input: Partial<{ durationDays: number; price: number }>,
): Promise<UnitPricing> {
  const res = await apiFetch<ApiDataResponse<UnitPricing>>(
    `/admin/unit-pricings/${id}`,
    { method: "PUT", body: input },
  );
  return res.data;
}

export async function deleteUnitPricing(id: string): Promise<UnitPricing> {
  const res = await apiFetch<ApiDataResponse<UnitPricing>>(
    `/admin/unit-pricings/${id}`,
    { method: "DELETE" },
  );
  return res.data;
}

export async function upsertUnitPricingPackages(input: {
  unitTypeId: string;
  monthlyPrice: number;
  dailyPrice: number;
}): Promise<{ monthly: UnitPricing; daily: UnitPricing }> {
  const res = await apiFetch<
    ApiDataResponse<{ monthly: UnitPricing; daily: UnitPricing }>
  >("/admin/unit-pricings/packages", { method: "PUT", body: input });
  return res.data;
}

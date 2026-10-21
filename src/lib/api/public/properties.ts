import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export interface PublicAttachment {
  id: string;
  url: string;
}

export interface PublicPricing {
  id: string;
  durationDays: number;
  price: number;
}

export interface PublicUnit {
  id: string;
  name: string;
  maxOccupancy: number | null;
  status: "vacant" | "occupied";
}

export interface PublicUnitType {
  id: string;
  name: string;
  description: string | null;
  size: number | null;
  unitTypeAttachments?: PublicAttachment[];
  pricings: PublicPricing[];
  units: PublicUnit[];
}

export interface PublicProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  /** Refundable deposit (Rp); null when the owner hasn't set one. */
  depositAmount?: number | null;
  propertyAttachments?: PublicAttachment[];
  unitTypes: PublicUnitType[];
}

export interface PublicPropertiesResponse {
  data: PublicProperty[];
}

export interface PublicPropertyResponse {
  data: PublicProperty;
}

function unwrapList<T>(payload: { data: T[] } | T[] | null | undefined): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.data ?? [];
}

function unwrapItem<T>(payload: { data: T } | T | null | undefined): T | null {
  if (!payload) return null;
  if (
    typeof payload === "object" &&
    "data" in payload &&
    payload.data != null &&
    !Array.isArray(payload.data)
  ) {
    return payload.data as T;
  }
  return payload as T;
}

export async function listPublicProperties(): Promise<PublicProperty[]> {
  const res = await apiFetch<PublicPropertiesResponse | PublicProperty[]>(
    "/public/properties",
  );
  return unwrapList(res);
}

export async function getPublicProperty(id: string): Promise<PublicProperty> {
  const res = await apiFetch<PublicPropertyResponse | PublicProperty>(
    `/public/properties/${id}`,
  );
  const property = unwrapItem(res);
  if (!property) {
    throw new ApiError("NOT_FOUND", "Property not found", 404);
  }
  return property;
}

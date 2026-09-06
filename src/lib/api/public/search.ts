import { apiFetch } from "@/lib/api/client";
import type {
  PublicAttachment,
  PublicPricing,
} from "@/lib/api/public/properties";

export type PublicSearchSortBy =
  | "property-asc"
  | "price-asc"
  | "price-desc"
  | "newest";

export interface PublicSearchProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  propertyAttachments?: PublicAttachment[];
  primaryImageUrl?: string | null;
}

export interface PublicSearchUnitType {
  id: string;
  name: string;
  description: string | null;
  size: number | null;
  unitTypeAttachments?: PublicAttachment[];
  primaryImageUrl?: string | null;
  pricings: PublicPricing[];
}

export interface PublicSearchUnitTypeResult {
  id: string;
  propertyId: string;
  name: string;
  description: string | null;
  size: number | null;
  propertyName: string;
  address: string;
  city: string;
  images: string[];
  thumbnail: string;
  pricings: PublicPricing[];
  minPrice: number;
  availableCount: number;
  totalCount: number;
  property: PublicSearchProperty;
  unitType: PublicSearchUnitType;
}

export interface PublicSearchParams {
  q?: string;
  city?: string;
  propertyId?: string;
  unitTypeId?: string;
  status?: "vacant" | "occupied";
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  durationDays?: number;
  page?: number;
  pageSize?: number;
  sortBy?: PublicSearchSortBy;
}

export interface PublicSearchPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PublicSearchResponse {
  data: PublicSearchUnitTypeResult[];
  meta: {
    total: number;
    unitTotal: number;
    pagination: PublicSearchPagination;
  };
}

function buildQueryString(params: PublicSearchParams): string {
  const search = new URLSearchParams();

  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.city?.trim()) search.set("city", params.city.trim());
  if (params.propertyId) search.set("propertyId", params.propertyId);
  if (params.unitTypeId) search.set("unitTypeId", params.unitTypeId);
  if (params.status) search.set("status", params.status);
  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);
  if (params.minPrice !== undefined) search.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) search.set("maxPrice", String(params.maxPrice));
  if (params.durationDays !== undefined) {
    search.set("durationDays", String(params.durationDays));
  }
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.pageSize !== undefined) search.set("pageSize", String(params.pageSize));
  if (params.sortBy) search.set("sortBy", params.sortBy);

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function searchPublicUnits(
  params: PublicSearchParams = {},
): Promise<PublicSearchResponse> {
  const query = buildQueryString(params);
  return apiFetch<PublicSearchResponse>(`/public/search${query}`);
}

import type {
  PublicSearchParams,
  PublicSearchSortBy,
} from "@/lib/api/public/search";
import type { SearchFilters } from "@/lib/types";

export const DEFAULT_SEARCH_PAGE_SIZE = 12;

/**
 * Initial load for /search-kosts → GET /public/search
 *
 * Example:
 *   GET /public/search?status=vacant&minPrice=500000&maxPrice=2500000&page=1&pageSize=12
 */
export const DEFAULT_PUBLIC_SEARCH_PARAMS: PublicSearchParams = {
  status: "vacant",
  minPrice: 500_000,
  maxPrice: 2_500_000,
  page: 1,
  pageSize: DEFAULT_SEARCH_PAGE_SIZE,
  sortBy: "property-asc",
};

/** Cleared filters — show all room types (no keyword, property, price, or status filter). */
export function createResetSearchFilters(): SearchFilters {
  return {
    availability: "all",
    sortBy: "property-asc",
    page: 1,
    pageSize: DEFAULT_SEARCH_PAGE_SIZE,
  };
}

/** Returns a fresh filters object (avoids shared-reference bugs on reset). */
export function createDefaultSearchFilters(): SearchFilters {
  return createResetSearchFilters();
}

/** UI defaults on the search page (hero dock + results toolbar). */
export const DEFAULT_SEARCH_FILTERS = createDefaultSearchFilters();

export type SearchPriceBand = "any" | "under1" | "1to2" | "2to3" | "3plus";

export function priceBandFromFilters(
  filters: Pick<SearchFilters, "priceMin" | "priceMax">,
): SearchPriceBand {
  const min = filters.priceMin;
  const max = filters.priceMax;
  if (min === 3_000_000 && max === undefined) return "3plus";
  if (min === 2_000_000 && max === 3_000_000) return "2to3";
  if (min === 1_000_000 && max === 2_000_000) return "1to2";
  if (min === undefined && max === 1_000_000) return "under1";
  return "any";
}

export function filtersFromPriceBand(
  band: SearchPriceBand,
): Pick<SearchFilters, "priceMin" | "priceMax"> {
  switch (band) {
    case "under1":
      return { priceMin: undefined, priceMax: 1_000_000 };
    case "1to2":
      return { priceMin: 1_000_000, priceMax: 2_000_000 };
    case "2to3":
      return { priceMin: 2_000_000, priceMax: 3_000_000 };
    case "3plus":
      return { priceMin: 3_000_000, priceMax: undefined };
    default:
      return { priceMin: undefined, priceMax: undefined };
  }
}

export function hasCustomPriceRange(
  filters: Pick<SearchFilters, "priceMin" | "priceMax">,
): boolean {
  const hasRange =
    filters.priceMin !== undefined || filters.priceMax !== undefined;
  return hasRange && priceBandFromFilters(filters) === "any";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SEARCH_PAGE_SIZE = 50;

const SORT_BY_VALUES = [
  "property-asc",
  "price-asc",
  "price-desc",
  "newest",
] as const satisfies readonly NonNullable<SearchFilters["sortBy"]>[];

function isSearchSortBy(
  value: string,
): value is NonNullable<SearchFilters["sortBy"]> {
  return (SORT_BY_VALUES as readonly string[]).includes(value);
}

function parsePositiveInt(
  value: string | null,
  min: number,
  max: number,
): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return undefined;
  }
  return parsed;
}

function parseIsoDate(value: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !ISO_DATE.test(trimmed)) return undefined;
  const time = Date.parse(`${trimmed}T00:00:00`);
  if (Number.isNaN(time)) return undefined;
  return trimmed;
}

/** Next.js `searchParams` (sync or awaited) → `URLSearchParams` for restore. */
export function searchParamsToURLSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const raw = Array.isArray(value) ? value[0] : value;
    if (raw) params.set(key, raw);
  }
  return params;
}

export function filtersToQueryString(filters: SearchFilters): string {
  const search = new URLSearchParams();
  const q = (filters.location ?? "").trim();
  if (q) search.set("q", q);

  const city = (filters.city ?? "").trim();
  if (city) search.set("city", city);

  if (filters.propertyId) search.set("propertyId", filters.propertyId);
  if (filters.priceMin !== undefined)
    search.set("minPrice", String(filters.priceMin));
  if (filters.priceMax !== undefined)
    search.set("maxPrice", String(filters.priceMax));
  if (filters.availability) search.set("availability", filters.availability);
  if (filters.durationDays !== undefined) {
    search.set("durationDays", String(filters.durationDays));
  }

  if (filters.startDate) search.set("startDate", filters.startDate);
  if (filters.endDate) search.set("endDate", filters.endDate);

  const sortBy = filters.sortBy ?? "property-asc";
  if (sortBy !== "property-asc") search.set("sortBy", sortBy);

  const page = filters.page ?? 1;
  if (page > 1) search.set("page", String(page));

  const pageSize = filters.pageSize ?? DEFAULT_SEARCH_PAGE_SIZE;
  if (pageSize !== DEFAULT_SEARCH_PAGE_SIZE) {
    search.set("pageSize", String(pageSize));
  }

  return search.toString();
}

export function queryStringToFilters(params: URLSearchParams): SearchFilters {
  const filters = createDefaultSearchFilters();
  const q = params.get("q")?.trim();
  if (q) filters.location = q;

  const city = params.get("city")?.trim();
  if (city) filters.city = city;

  const propertyId = params.get("propertyId")?.trim();
  if (propertyId) filters.propertyId = propertyId;

  const minPrice = params.get("minPrice");
  if (minPrice && Number.isFinite(Number(minPrice))) {
    filters.priceMin = Number(minPrice);
  }

  const maxPrice = params.get("maxPrice");
  if (maxPrice && Number.isFinite(Number(maxPrice))) {
    filters.priceMax = Number(maxPrice);
  }

  const availability = params.get("availability");
  if (availability === "available" || availability === "all") {
    filters.availability = availability;
  }

  const durationDays = params.get("durationDays");
  if (durationDays && Number.isFinite(Number(durationDays))) {
    filters.durationDays = Number(durationDays);
  }

  const startDate = parseIsoDate(params.get("startDate"));
  if (startDate) filters.startDate = startDate;

  const endDate = parseIsoDate(params.get("endDate"));
  if (endDate) filters.endDate = endDate;

  const sortBy = params.get("sortBy");
  if (sortBy && isSearchSortBy(sortBy)) {
    filters.sortBy = sortBy;
  }

  const page = parsePositiveInt(params.get("page"), 1, 10_000);
  if (page) filters.page = page;

  const pageSize = parsePositiveInt(
    params.get("pageSize"),
    1,
    MAX_SEARCH_PAGE_SIZE,
  );
  if (pageSize) filters.pageSize = pageSize;

  return filters;
}

const SORT_MAP: Record<
  NonNullable<SearchFilters["sortBy"]>,
  PublicSearchSortBy
> = {
  "property-asc": "property-asc",
  "price-asc": "price-asc",
  "price-desc": "price-desc",
  newest: "newest",
};

/**
 * Maps frontend filter state → backend query params (DB-backed fields only).
 *
 * | UI field (SearchFilters) | API param      | DB / notes |
 * |--------------------------|----------------|------------|
 * | location                 | q              | unit.name, property.name/address/city, unitType.name |
 * | city                     | city           | property.city |
 * | propertyId               | propertyId     | unit.propertyId |
 * | unitTypeId               | unitTypeId     | unit.unitTypeId |
 * | availability=available   | status=vacant  | unit.status |
 * | priceMin                 | minPrice       | unit_pricing.price |
 * | priceMax                 | maxPrice       | unit_pricing.price |
 * | durationDays             | durationDays   | unit_pricing.durationDays |
 * | startDate + endDate      | startDate/endDate | lease overlap exclusion — **URL/API ready; public UI does not expose date pickers yet** |
 * | page, pageSize           | page, pageSize | pagination |
 * | sortBy                   | sortBy         | server-side sort |
 */
export function searchFiltersToApiParams(
  filters: SearchFilters,
): PublicSearchParams {
  const params: PublicSearchParams = {};

  const q = (filters.location ?? "").trim();
  if (q) params.q = q;

  const city = (filters.city ?? "").trim();
  if (city) params.city = city;

  if (filters.propertyId) params.propertyId = filters.propertyId;
  if (filters.unitTypeId) params.unitTypeId = filters.unitTypeId;

  if (filters.priceMin !== undefined) params.minPrice = filters.priceMin;
  if (filters.priceMax !== undefined) params.maxPrice = filters.priceMax;

  if (filters.availability === "available") {
    params.status = "vacant";
  }

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  if (filters.durationDays !== undefined) {
    params.durationDays = filters.durationDays;
  }

  if (filters.sortBy) {
    params.sortBy = SORT_MAP[filters.sortBy] ?? "property-asc";
  }

  params.page = filters.page ?? 1;
  params.pageSize = filters.pageSize ?? DEFAULT_SEARCH_PAGE_SIZE;

  return params;
}

/** Builds full URL for debugging / sharing with backend team. */
export function buildPublicSearchUrl(
  baseUrl: string,
  params: PublicSearchParams = DEFAULT_PUBLIC_SEARCH_PARAMS,
): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.city) search.set("city", params.city);
  if (params.propertyId) search.set("propertyId", params.propertyId);
  if (params.unitTypeId) search.set("unitTypeId", params.unitTypeId);
  if (params.status) search.set("status", params.status);
  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);
  if (params.minPrice !== undefined)
    search.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined)
    search.set("maxPrice", String(params.maxPrice));
  if (params.durationDays !== undefined) {
    search.set("durationDays", String(params.durationDays));
  }
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.pageSize !== undefined)
    search.set("pageSize", String(params.pageSize));
  if (params.sortBy) search.set("sortBy", params.sortBy);
  const qs = search.toString();
  return `${baseUrl.replace(/\/$/, "")}/public/search${qs ? `?${qs}` : ""}`;
}

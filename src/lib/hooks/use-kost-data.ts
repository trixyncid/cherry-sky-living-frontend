/**
 * React hooks for fetching kost data
 * Public-facing property catalogue (read-only)
 */

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Kost, SearchFilters, SearchUnitTypeResult } from '../types';
import {
    getPublicProperty,
    listPublicProperties,
    type PublicPricing,
    type PublicProperty,
} from '@/lib/api/public/properties';
import { searchFiltersToApiParams } from '@/lib/api/public/search-contract';
import {
    searchPublicUnits,
    type PublicSearchUnitTypeResult,
} from '@/lib/api/public/search';
import { getContactWhatsAppNumber } from '@/lib/contact';
import { publicKeys } from '@/lib/query/keys';
import { isNotFoundApiError } from '@/lib/api/errors';

function toSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function mapRoomTypePricings(pricings: PublicPricing[] | undefined) {
    return (pricings ?? [])
        .filter((p) => Number.isFinite(p.price))
        .sort((a, b) => a.durationDays - b.durationDays)
        .map((p) => ({
            id: p.id,
            durationDays: p.durationDays,
            price: p.price,
        }));
}

/** Placeholder only when a property/unit type has no uploaded images. */
const EMPTY_IMAGE_PLACEHOLDER =
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop';

function formatCapacityFromOccupancy(occupancies: number[]): string {
    if (occupancies.length === 0) return '—';
    const minOcc = Math.min(...occupancies);
    const maxOcc = Math.max(...occupancies);
    return minOcc === maxOcc ? String(minOcc) : `${minOcc}–${maxOcc}`;
}

function mapPublicPropertyToKost(property: PublicProperty, index: number): Kost {
    const unitTypes = property.unitTypes ?? [];
    const allPricings = unitTypes.flatMap((ut) => ut.pricings ?? []);
    const prices = allPricings.map((p) => p.price).filter((p) => Number.isFinite(p));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const totalRooms = unitTypes.reduce((sum, ut) => sum + (ut.units?.length ?? 0), 0);
    const availableRooms = unitTypes.reduce(
        (sum, ut) => sum + (ut.units ?? []).filter((u) => u.status === 'vacant').length,
        0,
    );

    const propertyImageUrls =
        property.propertyAttachments?.map((a) => a.url).filter(Boolean) ?? [];

    const roomTypes = unitTypes.map((ut) => {
        const utPrices = (ut.pricings ?? []).map((p) => p.price).filter((p) => Number.isFinite(p));
        const price = utPrices.length > 0 ? Math.min(...utPrices) : minPrice;
        const totalCount = ut.units?.length ?? 0;
        const availableCount = (ut.units ?? []).filter((u) => u.status === 'vacant').length;
        const unitTypeImages =
            ut.unitTypeAttachments?.map((a) => a.url).filter(Boolean) ?? [];

        const roomPricings = mapRoomTypePricings(ut.pricings);

        const occupancies = (ut.units ?? [])
            .map((u) => u.maxOccupancy)
            .filter((n): n is number => n != null && n > 0);

        return {
            id: ut.id,
            name: ut.name,
            price,
            pricings: roomPricings.length > 0 ? roomPricings : undefined,
            // Not in public API — omit inventing bathroom/type catalogue fields.
            capacity: formatCapacityFromOccupancy(occupancies),
            size: ut.size ?? undefined,
            availableCount,
            totalCount,
            status: availableCount > 0 ? ('available' as const) : ('full' as const),
            waitlistEnabled: false,
            images: unitTypeImages.length > 0 ? unitTypeImages : propertyImageUrls,
            description: ut.description?.trim() || undefined,
        };
    });

    const thumbnail = propertyImageUrls[0] ?? EMPTY_IMAGE_PLACEHOLDER;
    const images =
        propertyImageUrls.length > 0 ? propertyImageUrls : [EMPTY_IMAGE_PLACEHOLDER];

    const description = unitTypes
        .map((ut) => ut.description?.trim())
        .filter(Boolean)
        .join(' · ');

    return {
        id: property.id,
        name: property.name,
        slug: toSlug(property.name),
        // Property gender/type is not in the public API yet.
        type: undefined,
        description,
        location: {
            address: property.address,
            city: property.city,
        },
        priceRange: { min: minPrice, max: maxPrice },
        images,
        thumbnail,
        roomTypes,
        facilities: [],
        highlights: [],
        totalRooms,
        availableRooms,
        isFeatured: index < 2,
        whatsappNumber: getContactWhatsAppNumber(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Hook to fetch all kosts
 */
export function useKosts() {
    const query = useQuery({
        queryKey: publicKeys.properties.all(),
        queryFn: listPublicProperties,
        enabled: true,
    });

    const data = useMemo(() => {
        const rows = query.data ?? [];
        return rows.map((p, idx) => mapPublicPropertyToKost(p, idx));
    }, [query.data]);

    return { data, isLoading: query.isPending, error: query.error as Error | null };
}

/**
 * Hook to fetch featured kosts
 */
export function useFeaturedKosts() {
    const query = useQuery({
        queryKey: [...publicKeys.properties.all(), 'featured'] as const,
        queryFn: listPublicProperties,
        enabled: true,
    });

    const data = useMemo(() => {
        const rows = query.data ?? [];
        return rows.slice(0, 2).map((p, idx) => mapPublicPropertyToKost(p, idx));
    }, [query.data]);

    return { data, isLoading: query.isPending, error: query.error as Error | null };
}

/**
 * Hook to fetch a single kost by ID
 */
export function useKost(id: string) {
    const query = useQuery({
        queryKey: publicKeys.properties.detail(id),
        queryFn: () => getPublicProperty(id),
        enabled: !!id,
        retry: (failureCount, error) =>
            isNotFoundApiError(error) ? false : failureCount < 1,
    });

    const data = useMemo(() => {
        const p = query.data;
        return p ? mapPublicPropertyToKost(p, 0) : null;
    }, [query.data]);

    return {
        data,
        isLoading: query.isPending,
        isError: query.isError,
        isFetching: query.isFetching,
        error: query.error as Error | null,
        refetch: query.refetch,
    };
}

function mapSearchUnitTypeResults(rows: PublicSearchUnitTypeResult[]): SearchUnitTypeResult[] {
    const whatsappNumber = getContactWhatsAppNumber();
    return rows.map((row) => ({
        id: row.id,
        propertyId: row.propertyId,
        name: row.name,
        propertyName: row.propertyName,
        address: row.address,
        city: row.city,
        images: row.images,
        thumbnail: row.thumbnail,
        availableCount: row.availableCount,
        totalCount: row.totalCount,
        pricings: mapRoomTypePricings(row.pricings),
        minPrice: row.minPrice,
        whatsappNumber,
        size: row.size ?? undefined,
        description: row.description ?? undefined,
    }));
}

function withSearchFallbackImages(rows: SearchUnitTypeResult[]): SearchUnitTypeResult[] {
    return rows.map((row) => {
        if (row.thumbnail) return row;

        return {
            ...row,
            images: [EMPTY_IMAGE_PLACEHOLDER],
            thumbnail: EMPTY_IMAGE_PLACEHOLDER,
        };
    });
}

/**
 * Hook to search unit types via GET /public/search (server filters, sort, pagination).
 */
export function useSearchUnitTypes(filters: SearchFilters) {
    const apiParams = useMemo(() => searchFiltersToApiParams(filters), [filters]);

    const query = useQuery({
        queryKey: publicKeys.search.list(apiParams as Record<string, unknown>),
        queryFn: () => searchPublicUnits(apiParams),
        staleTime: 30_000,
        enabled: true,
    });

    const data = useMemo(() => {
        const rows = query.data?.data ?? [];
        return withSearchFallbackImages(mapSearchUnitTypeResults(rows));
    }, [query.data]);

    return {
        data,
        total: query.data?.meta?.total ?? 0,
        unitTotal: query.data?.meta?.unitTotal ?? 0,
        pagination: query.data?.meta?.pagination,
        isLoading: query.isPending,
        isFetching: query.isFetching,
        error: query.error as Error | null,
    };
}

/**
 * Hook for immediate data without loading (for SSR/SSG)
 */
export function useKostsImmediate() {
    return [];
}

export function useFeaturedKostsImmediate() {
    return [];
}

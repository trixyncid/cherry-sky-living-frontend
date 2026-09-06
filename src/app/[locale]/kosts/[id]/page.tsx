/**
 * Kost Property Detail Page
 * - /kosts/{propertyId} → property overview with unit type list
 * - /kosts/{propertyId}--{unitTypeId} → redirected to /kosts/{propertyId}/{unitTypeId}
 */

import { dehydrate } from '@tanstack/react-query';
import { KostRoutePage } from '@/components/kost/KostRoutePage';
import { PublicHydration } from '@/components/query/public-hydration';
import { redirect } from '@/i18n/routing';
import { createPrefetchQueryClient } from '@/lib/query/get-query-client';
import { prefetchPublicProperty } from '@/lib/query/prefetch-public';

export default async function KostDetailPage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id: routeId, locale } = await params;
    const separatorIndex = routeId.indexOf('--');

    if (separatorIndex > 0) {
        const kostId = routeId.substring(0, separatorIndex);
        const unitTypeId = routeId.substring(separatorIndex + 2);
        redirect({ href: `/kosts/${kostId}/${unitTypeId}`, locale });
    }

    const queryClient = createPrefetchQueryClient();
    await prefetchPublicProperty(queryClient, routeId);

    return (
        <PublicHydration state={dehydrate(queryClient)}>
            <KostRoutePage kostId={routeId} />
        </PublicHydration>
    );
}

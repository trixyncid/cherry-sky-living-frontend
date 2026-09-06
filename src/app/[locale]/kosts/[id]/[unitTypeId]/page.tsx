/**
 * Kost Room / Unit Type Detail Page
 * - /kosts/{propertyId}/{unitTypeId} → individual unit type detail
 */

import { dehydrate } from '@tanstack/react-query';
import { KostRoutePage } from '@/components/kost/KostRoutePage';
import { PublicHydration } from '@/components/query/public-hydration';
import { createPrefetchQueryClient } from '@/lib/query/get-query-client';
import { prefetchPublicProperty } from '@/lib/query/prefetch-public';

export default async function KostRoomDetailPage({
    params,
}: {
    params: Promise<{ id: string; unitTypeId: string }>;
}) {
    const { id: kostId, unitTypeId } = await params;
    const queryClient = createPrefetchQueryClient();
    await prefetchPublicProperty(queryClient, kostId);

    return (
        <PublicHydration state={dehydrate(queryClient)}>
            <KostRoutePage kostId={kostId} roomTypeId={unitTypeId} />
        </PublicHydration>
    );
}

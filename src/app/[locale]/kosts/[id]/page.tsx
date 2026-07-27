/**
 * Kost Property & Room Detail Page
 * - /kosts/{propertyId} → property overview with unit type list
 * - /kosts/{propertyId}--{unitTypeId} → individual unit type detail
 */

'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { AppLayout } from '@/components/layout/AppLayout';
import { Icon } from '@/components/shared/Icon';
import { PropertyDetailView } from '@/components/kost/PropertyDetailView';
import { RoomDetailView } from '@/components/kost/RoomDetailView';
import { useKost } from '@/lib/hooks/use-kost-data';

export default function KostDetailPage() {
    const t = useTranslations();
    const params = useParams();
    const routeId = params.id as string;

    const separatorIndex = routeId?.indexOf('--');
    const kostId = separatorIndex > 0 ? routeId.substring(0, separatorIndex) : routeId;
    const roomTypeId = separatorIndex > 0 ? routeId.substring(separatorIndex + 2) : '';

    const { data: kost, isLoading } = useKost(kostId);

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] pt-16">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#6f4627] border-t-transparent" />
                        <p className="text-slate-500 dark:text-slate-500">{t('common.loading')}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!kost) {
        return (
            <AppLayout>
                <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] pt-16">
                    <div className="text-center">
                        <Icon name="error" size={64} className="mx-auto mb-4 text-[#83746b]" />
                        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                            {t('propertyDetail.notFound')}
                        </h2>
                        <p className="mb-6 text-slate-500 dark:text-slate-400">
                            {t('propertyDetail.notFoundDescription')}
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90"
                        >
                            <Icon name="home" size={20} />
                            {t('roomDetail.backToHome')}
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (roomTypeId) {
        return <RoomDetailView kost={kost} roomTypeId={roomTypeId} />;
    }

    return <PropertyDetailView kost={kost} />;
}

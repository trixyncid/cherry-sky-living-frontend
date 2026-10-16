'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AppLayout } from '@/components/layout/AppLayout';
import { Icon } from '@/components/shared/Icon';
import { PropertyDetailView } from '@/components/kost/PropertyDetailView';
import { RoomDetailView } from '@/components/kost/RoomDetailView';
import { isNotFoundApiError } from '@/lib/api/errors';
import { useKost } from '@/lib/hooks/use-kost-data';

type KostRoutePageProps = {
    kostId: string;
    roomTypeId?: string;
};

export function KostRoutePage({ kostId, roomTypeId }: KostRoutePageProps) {
    const t = useTranslations();
    const { data: kost, isLoading, isError, error, refetch, isFetching } = useKost(kostId);

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex min-h-screen items-center justify-center pt-16">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#141414] border-t-transparent" />
                        <p className="text-[#6b6b6b]">{t('common.loading')}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (isError && !isNotFoundApiError(error)) {
        return (
            <AppLayout>
                <div className="flex min-h-screen items-center justify-center pt-16">
                    <div className="text-center">
                        <Icon name="error_outline" size={64} className="mx-auto mb-4 text-[#6b6b6b]" />
                        <h2 className="mb-2 text-2xl font-medium tracking-tight text-[#141414]">
                            {t('propertyDetail.loadError')}
                        </h2>
                        <p className="mb-6 text-[#6b6b6b]">
                            {t('propertyDetail.loadErrorDescription')}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                disabled={isFetching}
                                onClick={() => void refetch()}
                                className="inline-flex items-center gap-2 rounded-full bg-[#71130d] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#8a1a12] disabled:opacity-60"
                            >
                                <Icon name="refresh" size={20} />
                                {t('common.tryAgain')}
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-full border border-[#dedad4] px-6 py-3 font-semibold text-[#141414] transition-colors hover:bg-white"
                            >
                                <Icon name="home" size={20} />
                                {t('roomDetail.backToHome')}
                            </Link>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!kost) {
        return (
            <AppLayout>
                <div className="flex min-h-screen items-center justify-center pt-16">
                    <div className="text-center">
                        <Icon name="error" size={64} className="mx-auto mb-4 text-[#6b6b6b]" />
                        <h2 className="mb-2 text-2xl font-medium tracking-tight text-[#141414]">
                            {t('propertyDetail.notFound')}
                        </h2>
                        <p className="mb-6 text-[#6b6b6b]">
                            {t('propertyDetail.notFoundDescription')}
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-full bg-[#71130d] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#8a1a12]"
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

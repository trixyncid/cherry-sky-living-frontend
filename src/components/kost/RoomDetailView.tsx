/**
 * Room detail — cinematic hero, mosaic photos, glass booking card
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { AppLayout } from '@/components/layout/AppLayout';
import { Footer } from '@/components/layout/Footer';
import { ImageGallery } from '@/components/kost/ImageGallery';
import { RoomDetailSidebar } from '@/components/kost/RoomDetailSidebar';
import { RoomTypeCard } from '@/components/kost/RoomTypeCard';
import { KostBreadcrumb, useKostBreadcrumbs } from '@/components/kost/KostBreadcrumb';
import { Icon } from '@/components/shared/Icon';
import { Link } from '@/i18n/routing';
import type { Kost } from '@/lib/types';
import { sortRoomTypesForDisplay } from '@/lib/utils/kost-display';
import { formatCapacity } from '@/lib/utils/format';

interface RoomDetailViewProps {
    kost: Kost;
    roomTypeId: string;
}

export function RoomDetailView({ kost, roomTypeId }: RoomDetailViewProps) {
    const t = useTranslations();
    const locale = useLocale();
    const crumbs = useKostBreadcrumbs();

    const roomType = kost.roomTypes.find((rt) => rt.id === roomTypeId);
    if (!roomType) {
        return (
            <AppLayout>
                <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] pt-16">
                    <div className="text-center">
                        <Icon name="error" size={64} className="mx-auto mb-4 text-[#83746b]" />
                        <h2 className="mb-2 text-2xl font-bold text-[#1a1c1a]">
                            {t('propertyDetail.unitTypeNotFound')}
                        </h2>
                        <Link
                            href={`/kosts/${kost.id}`}
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#6f4627] px-6 py-3 text-white transition-colors hover:bg-[#5a3820]"
                        >
                            <Icon name="arrow_back" size={20} />
                            {t('propertyDetail.backToProperty')}
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const isAvailable = roomType.status === 'available' && roomType.availableCount > 0;
    const otherRoomTypes = sortRoomTypesForDisplay(
        kost.roomTypes.filter((rt) => rt.id !== roomTypeId),
    );
    const heroImage = roomType.images[0] || kost.thumbnail;

    const breadcrumbItems = [
        crumbs.home,
        crumbs.search,
        crumbs.property(kost.name, kost.id),
        crumbs.unitType(roomType.name),
    ];

    return (
        <AppLayout>
            <section className="relative flex min-h-[min(42svh,22rem)] w-full flex-col justify-end overflow-hidden hero-atmosphere pt-[max(5rem,calc(4rem+env(safe-area-inset-top)))] lg:min-h-[min(46svh,26rem)]">
                <div className="absolute inset-0">
                    {heroImage ? (
                        <motion.div
                            initial={{ scale: 1.08 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={heroImage}
                                alt={roomType.name}
                                fill
                                priority
                                sizes="100vw"
                                className="object-cover object-center"
                            />
                        </motion.div>
                    ) : null}
                    <div className="absolute inset-0 hero-overlay-x" />
                    <div className="absolute inset-0 hero-overlay-y" />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-6 lg:px-10 lg:pb-24">
                    <KostBreadcrumb items={breadcrumbItems} tone="onDark" className="mb-6" />

                    <div className="mb-4 flex flex-wrap gap-2">
                        {isAvailable ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a130f]/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                <span className="h-1.5 w-1.5 rounded-full bg-status-vacant" />
                                {t('status.available')}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a130f]/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                <span className="h-1.5 w-1.5 rounded-full bg-status-occupied" />
                                {t('status.full')}
                            </span>
                        )}
                    </div>

                    <motion.h1
                        initial={{ y: 18, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="max-w-3xl text-[2.15rem] font-bold leading-[1.1] tracking-tight text-[#faf9f6] sm:text-5xl"
                    >
                        {roomType.name}
                    </motion.h1>
                    <p className="mt-2 text-sm font-medium text-white/80 md:text-base">{kost.name}</p>
                    <p className="mt-2 flex max-w-xl items-start gap-2 text-sm text-white/75">
                        <Icon name="location_on" size={18} className="mt-0.5 shrink-0 text-[#d4af37]" />
                        <span>
                            {kost.location.address}
                            {kost.location.city ? `, ${kost.location.city}` : ''}
                        </span>
                    </p>
                </div>
            </section>

            <div className="relative z-10 -mt-8 rounded-t-[2rem] bg-[#faf9f6] pb-10 pt-12 lg:-mt-10 lg:pt-14">
                <div className="mx-auto max-w-7xl px-6 lg:px-10">
                    {roomType.images.length > 0 ? (
                        <div className="mb-6">
                            <ImageGallery
                                images={roomType.images}
                                alt={roomType.name}
                                variant="mosaic"
                            />
                        </div>
                    ) : null}

                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="space-y-8">
                            <section>
                                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
                                    {t('roomDetail.roomDetails')}
                                </h2>
                                <div className="grid grid-cols-2 gap-4 sm:max-w-lg">
                                    {roomType.size != null && (
                                        <div className="glass-card flex items-center gap-3 rounded-2xl p-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5e4d4]">
                                                <Icon name="square_foot" size={20} className="text-[#6f4627]" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#83746b]">{t('roomDetail.size')}</p>
                                                <p className="font-semibold text-[#1a1c1a]">{roomType.size} m²</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="glass-card flex items-center gap-3 rounded-2xl p-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5e4d4]">
                                            <Icon name="people" size={20} className="text-[#6f4627]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#83746b]">{t('roomDetail.capacity')}</p>
                                            <p className="font-semibold text-[#1a1c1a]">
                                                {formatCapacity(
                                                    roomType.capacity,
                                                    locale === 'en' ? 'en' : 'id',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {roomType.description ? (
                                <section>
                                    <h2 className="mb-3 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
                                        {t('roomDetail.aboutPlace')}
                                    </h2>
                                    <p className="max-w-2xl text-base leading-relaxed text-[#51443c]">
                                        {roomType.description}
                                    </p>
                                    {kost.location.nearbyLandmark ? (
                                        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#e8dfd6] bg-[#f5e4d4]/40 p-4">
                                            <Icon name="school" size={20} className="text-[#6f4627]" />
                                            <p className="text-sm font-medium text-[#1a1c1a]">
                                                {kost.location.nearbyLandmark}
                                            </p>
                                        </div>
                                    ) : null}
                                </section>
                            ) : null}

                            {roomType.availableCount > 0 ? (
                                <div className="glass-card rounded-2xl p-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="mb-1 font-semibold text-[#1a1c1a]">
                                                {t('roomDetail.availability')}
                                            </h3>
                                            <p className="text-sm text-[#83746b]">
                                                {t('roomDetail.availableRooms', {
                                                    available: roomType.availableCount,
                                                    total: roomType.totalCount,
                                                })}
                                            </p>
                                        </div>
                                        <div className="h-2.5 w-32 rounded-full bg-[#f0e6dc]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${
                                                        roomType.totalCount > 0
                                                            ? (roomType.availableCount / roomType.totalCount) * 100
                                                            : 0
                                                    }%`,
                                                }}
                                                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                                                className="h-2.5 rounded-full bg-[#6f4627]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {otherRoomTypes.length > 0 ? (
                                <section className="space-y-4 border-t border-[#e8dfd6] pt-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold tracking-tight text-[#1a1c1a]">
                                            {t('propertyDetail.otherRoomTypes')}
                                        </h2>
                                        <p className="mt-1 text-sm text-[#83746b]">
                                            {t('propertyDetail.otherRoomTypesDescription')}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {otherRoomTypes.map((other, index) => (
                                            <RoomTypeCard
                                                key={other.id}
                                                roomType={other}
                                                kostName={kost.name}
                                                kostId={kost.id}
                                                whatsappNumber={kost.whatsappNumber}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ) : null}
                        </div>

                        <RoomDetailSidebar
                            pricings={roomType.pricings ?? []}
                            fallbackPrice={roomType.price}
                            whatsappNumber={kost.whatsappNumber}
                            roomName={roomType.name}
                            propertyName={kost.name}
                            availableCount={roomType.availableCount}
                            totalCount={roomType.totalCount}
                        />
                    </div>
                </div>
            </div>
            <Footer />
        </AppLayout>
    );
}

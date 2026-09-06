/**
 * Property detail — cinematic hero, photo mosaic, glass inquiry card
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { AppLayout } from '@/components/layout/AppLayout';
import { Footer } from '@/components/layout/Footer';
import { ImageGallery } from '@/components/kost/ImageGallery';
import { RoomTypeCard } from '@/components/kost/RoomTypeCard';
import { KostBreadcrumb, useKostBreadcrumbs } from '@/components/kost/KostBreadcrumb';
import { WhatsAppInquiryDialog } from '@/components/kost/WhatsAppInquiryDialog';
import { Icon } from '@/components/shared/Icon';
import type { Kost } from '@/lib/types';
import { formatCurrency, generateWhatsAppURL } from '@/lib/utils/format';
import { sortRoomTypesForDisplay } from '@/lib/utils/kost-display';

interface PropertyDetailViewProps {
    kost: Kost;
}

export function PropertyDetailView({ kost }: PropertyDetailViewProps) {
    const t = useTranslations();
    const crumbs = useKostBreadcrumbs();
    const isAlmostFull = kost.availableRooms > 0 && kost.availableRooms <= 3;
    const sortedRoomTypes = sortRoomTypesForDisplay(kost.roomTypes);
    const heroImage = kost.images[0] || kost.thumbnail;
    const inquiryRoom = sortedRoomTypes[0];
    const viewingUrl = generateWhatsAppURL(
        kost.whatsappNumber,
        t('whatsapp.visitSchedule', { propertyName: kost.name }),
    );

    const breadcrumbItems = [
        crumbs.home,
        crumbs.search,
        crumbs.property(kost.name, kost.id),
    ];

    return (
        <AppLayout>
            <section className="relative flex min-h-[min(48svh,24rem)] w-full flex-col justify-end overflow-hidden hero-atmosphere pt-[max(5rem,calc(4rem+env(safe-area-inset-top)))] lg:min-h-[min(52svh,28rem)]">
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
                                alt={kost.name}
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
                    <KostBreadcrumb
                        items={breadcrumbItems}
                        tone="onDark"
                        className="mb-6"
                    />

                    <div className="mb-4 flex flex-wrap gap-2">
                        {kost.isFeatured ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-ferrugem/45 bg-maroon-deep/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />
                                {t('property.flagship')}
                            </span>
                        ) : null}
                        {kost.availableRooms > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a130f]/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                <span className="h-1.5 w-1.5 rounded-full bg-status-vacant" />
                                {t('propertyDetail.availableRooms', {
                                    available: kost.availableRooms,
                                    total: kost.totalRooms,
                                })}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a130f]/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                <span className="h-1.5 w-1.5 rounded-full bg-status-occupied" />
                                {t('status.full')}
                            </span>
                        )}
                        {isAlmostFull ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                                {t('status.almostFull')}
                            </span>
                        ) : null}
                    </div>

                    <motion.h1
                        initial={{ y: 18, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="max-w-3xl text-[2.15rem] font-bold leading-[1.1] tracking-tight text-[#faf9f6] sm:text-5xl"
                    >
                        {kost.name}
                    </motion.h1>

                    <p className="mt-3 flex max-w-xl items-start gap-2 text-sm text-white/80 md:text-base">
                        <Icon name="location_on" size={18} className="mt-0.5 shrink-0 text-[#d4af37]" />
                        <span>
                            {kost.location.address}
                            {kost.location.city ? `, ${kost.location.city}` : ''}
                        </span>
                    </p>

                    {kost.priceRange.min > 0 ? (
                        <p className="mt-4 text-sm text-white/75">
                            <span className="uppercase tracking-[0.16em] text-white/55">
                                {t('pricing.startingFrom')}{' '}
                            </span>
                            <span className="text-xl font-semibold text-white">
                                {formatCurrency(kost.priceRange.min, { compact: true })}
                            </span>
                        </p>
                    ) : null}

                    <div className="mt-7 flex flex-wrap gap-3">
                        <a
                            href={viewingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[#6f4627] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#805533]"
                        >
                            <Icon name="whatsapp" size={16} />
                            {t('cta.bookViewing')}
                        </a>
                        {kost.images.length > 0 ? (
                            <a
                                href="#photos"
                                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/15"
                            >
                                <Icon name="photo_library" size={16} />
                                {t('roomDetail.viewAllPhotos', { count: kost.images.length })}
                            </a>
                        ) : null}
                    </div>
                </div>
            </section>

            <div className="relative z-10 -mt-8 rounded-t-[2rem] bg-[#faf9f6] pb-10 pt-12 lg:-mt-10 lg:pt-14">
                <div className="mx-auto max-w-7xl px-6 lg:px-10">
                    {kost.images.length > 0 ? (
                        <div className="mb-6">
                            <ImageGallery
                                images={kost.images}
                                alt={kost.name}
                                variant="mosaic"
                            />
                        </div>
                    ) : null}

                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="space-y-8">
                            {kost.description ? (
                                <section>
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
                                        {t('property.details')}
                                    </p>
                                    <h2 className="mb-4 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
                                        {t('propertyDetail.aboutProperty')}
                                    </h2>
                                    <p className="max-w-2xl text-base leading-relaxed text-[#51443c]">
                                        {kost.description}
                                    </p>
                                </section>
                            ) : null}

                            <section className="space-y-4">
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight text-[#1a1c1a]">
                                        {t('propertyDetail.unitTypes')}
                                    </h2>
                                    <p className="mt-1 text-sm text-[#83746b]">
                                        {t('propertyDetail.unitTypesDescription')}
                                    </p>
                                </div>

                                {sortedRoomTypes.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {sortedRoomTypes.map((roomType, index) => (
                                            <RoomTypeCard
                                                key={roomType.id}
                                                roomType={roomType}
                                                kostName={kost.name}
                                                kostId={kost.id}
                                                whatsappNumber={kost.whatsappNumber}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass-card rounded-2xl px-6 py-8 text-center">
                                        <Icon
                                            name="meeting_room"
                                            size={36}
                                            className="mx-auto mb-3 text-[#d4c4b4]"
                                        />
                                        <p className="text-sm text-[#83746b]">
                                            {t('propertyDetail.noUnitTypes')}
                                        </p>
                                    </div>
                                )}
                            </section>

                            {kost.facilities.length > 0 ? (
                                <section>
                                    <h2 className="mb-4 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
                                        {t('property.amenities')}
                                    </h2>
                                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {kost.facilities.map((facility) => (
                                            <li
                                                key={facility.id}
                                                className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3"
                                            >
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5e4d4] text-[#6f4627]">
                                                    <Icon name={facility.icon} size={18} />
                                                </span>
                                                <span className="text-sm font-medium text-[#1a1c1a]">
                                                    {facility.name}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ) : null}

                            {kost.rules && kost.rules.length > 0 ? (
                                <section>
                                    <h2 className="mb-4 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
                                        {t('property.rules')}
                                    </h2>
                                    <ul className="space-y-2">
                                        {kost.rules.map((rule) => (
                                            <li
                                                key={rule}
                                                className="flex items-start gap-2 text-sm text-[#51443c]"
                                            >
                                                <Icon
                                                    name="check"
                                                    size={16}
                                                    className="mt-0.5 shrink-0 text-[#6f4627]"
                                                />
                                                {rule}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ) : null}
                        </div>

                        <aside className="lg:sticky lg:top-24 lg:self-start">
                            <div className="glass-card rounded-[1.75rem] p-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#83746b]">
                                    {t('propertyDetail.inquiryTitle')}
                                </p>
                                {kost.priceRange.min > 0 ? (
                                    <p className="mt-3">
                                        <span className="block text-xs font-semibold uppercase tracking-wide text-[#83746b]">
                                            {t('pricing.startingFrom')}
                                        </span>
                                        <span className="text-2xl font-bold text-[#1a1c1a]">
                                            {formatCurrency(kost.priceRange.min)}
                                        </span>
                                    </p>
                                ) : null}
                                <p className="mt-3 flex items-center gap-2 text-sm text-[#83746b]">
                                    <Icon name="key" size={16} className="text-[#6f4627]" />
                                    {t('propertyDetail.availableRooms', {
                                        available: kost.availableRooms,
                                        total: kost.totalRooms,
                                    })}
                                </p>
                                <p className="mt-4 text-sm leading-relaxed text-[#51443c]">
                                    {t('propertyDetail.inquiryHint')}
                                </p>
                                <a
                                    href={viewingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#6f4627] px-4 py-3 text-sm font-semibold text-white hover:bg-[#805533]"
                                >
                                    <Icon name="whatsapp" size={16} />
                                    {t('cta.bookViewing')}
                                </a>
                                {inquiryRoom ? (
                                    <div className="mt-3">
                                        <WhatsAppInquiryDialog
                                            phoneNumber={kost.whatsappNumber}
                                            propertyName={kost.name}
                                            roomName={inquiryRoom.name}
                                            pricings={inquiryRoom.pricings ?? []}
                                            fallbackPrice={inquiryRoom.price}
                                            className="w-full rounded-full"
                                            label={t('cta.sendInquiry')}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
            <Footer />
        </AppLayout>
    );
}

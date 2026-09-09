/**
 * Room Detail Sidebar Component
 * Sticky sidebar with pricing packages and booking CTA
 */

'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Icon } from '@/components/shared/Icon';
import { WhatsAppInquiryDialog } from '@/components/kost/WhatsAppInquiryDialog';
import type { RoomTypePricing } from '@/lib/types';
import { formatCurrency, generateWhatsAppURL } from '@/lib/utils/format';
import { getDurationLabel } from '@/lib/utils/kost-display';

interface RoomDetailSidebarProps {
    pricings: RoomTypePricing[];
    fallbackPrice: number;
    whatsappNumber: string;
    roomName: string;
    propertyName: string;
    availableCount: number;
    totalCount: number;
}

function durationIcon(durationDays: number): string {
    if (durationDays >= 30) return 'calendar_month';
    if (durationDays >= 7) return 'date_range';
    return 'today';
}

export function RoomDetailSidebar({
    pricings,
    fallbackPrice,
    whatsappNumber,
    roomName,
    propertyName,
    availableCount,
    totalCount,
}: RoomDetailSidebarProps) {
    const t = useTranslations();
    const customerServiceWhatsAppURL = generateWhatsAppURL(
        whatsappNumber,
        t('whatsapp.roomInquiry', { roomType: roomName, propertyName }),
    );

    const pricingRows =
        pricings.length > 0
            ? pricings
            : fallbackPrice > 0
              ? [{ id: 'fallback', durationDays: 30, price: fallbackPrice }]
              : [];

    const sortedPricings = [...pricingRows].sort(
        (a, b) => b.durationDays - a.durationDays,
    );
    const featuredPricing =
        sortedPricings.find((p) => p.durationDays === 30) ?? sortedPricings[0];
    const secondaryPricings = sortedPricings.filter(
        (p) =>
            !(
                p.id === featuredPricing?.id &&
                p.durationDays === featuredPricing.durationDays
            ),
    );
    const showPopularBadge =
        Boolean(featuredPricing) &&
        featuredPricing.durationDays === 30 &&
        secondaryPricings.length > 0;

    return (
        <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="glass-card rounded-[1.5rem] p-6"
                >
                    <div className="mb-5 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5e4d4] text-[#6f4627]">
                            <Icon name="sell" size={18} filled />
                        </span>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#83746b]">
                            {t('pricing.packages')}
                        </h3>
                    </div>

                    {featuredPricing ? (
                        <div className="mb-6 space-y-3">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.18, duration: 0.45 }}
                                className="relative overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#6f4627_0%,#8b5e3c_48%,#a44a32_100%)] px-5 py-5 text-white shadow-[0_14px_32px_rgb(90_36_48_/_0.22)]"
                            >
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl"
                                />
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-[#5a2430]/35 blur-2xl"
                                />

                                <div className="relative flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                                            <Icon
                                                name={durationIcon(featuredPricing.durationDays)}
                                                size={18}
                                            />
                                        </span>
                                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/70">
                                            {getDurationLabel(featuredPricing.durationDays, t)}
                                        </p>
                                    </div>
                                    {showPopularBadge ? (
                                        <span className="rounded-full bg-white/18 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white ring-1 ring-white/25">
                                            {t('pricing.popular')}
                                        </span>
                                    ) : null}
                                </div>

                                <p className="relative mt-5 text-[1.85rem] font-bold leading-none tracking-tight text-white sm:text-[2rem]">
                                    {formatCurrency(featuredPricing.price)}
                                </p>
                                {featuredPricing.durationDays === 30 ? (
                                    <p className="relative mt-2 text-sm text-white/65">
                                        {t('pricing.perMonth')}
                                    </p>
                                ) : null}
                            </motion.div>

                            {secondaryPricings.length > 0 ? (
                                <ul className="space-y-1.5">
                                    {secondaryPricings.map((pricing, index) => (
                                        <motion.li
                                            key={`${pricing.id}-${pricing.durationDays}`}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                delay: 0.24 + index * 0.06,
                                                duration: 0.4,
                                            }}
                                            className="group flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[#f7efe7]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5e4d4] text-[#6f4627] transition-colors group-hover:bg-[#edd6c3]">
                                                    <Icon
                                                        name={durationIcon(pricing.durationDays)}
                                                        size={18}
                                                    />
                                                </span>
                                                <span className="text-sm font-medium text-[#51443c]">
                                                    {getDurationLabel(pricing.durationDays, t)}
                                                </span>
                                            </div>
                                            <span className="text-base font-semibold tabular-nums text-[#1a1c1a]">
                                                {formatCurrency(pricing.price)}
                                            </span>
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : (
                        <p className="mb-6 text-sm text-[#83746b]">{t('search.noPricing')}</p>
                    )}

                    {totalCount > 0 && (
                        <p className="mb-4 flex items-center gap-2 text-sm text-[#83746b]">
                            <Icon name="key" size={18} className="text-[#6f4627]" />
                            {t('roomDetail.availableRooms', {
                                available: availableCount,
                                total: totalCount,
                            })}
                        </p>
                    )}

                    <WhatsAppInquiryDialog
                        phoneNumber={whatsappNumber}
                        propertyName={propertyName}
                        roomName={roomName}
                        pricings={pricings}
                        fallbackPrice={fallbackPrice}
                        className="w-full"
                        label={t('cta.sendInquiry')}
                    />
                    <p className="mt-4 text-center text-xs text-[#b0a29a]">
                        {t('roomDetail.notChargedYet')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="glass-card flex items-center gap-4 rounded-[1.5rem] p-4"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5e4d4]">
                        <Icon name="support_agent" size={24} className="text-[#6f4627]" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-[#1a1c1a]">Customer Service</p>
                        <p className="text-xs text-[#83746b]">Property Manager</p>
                    </div>
                    <a
                        href={customerServiceWhatsAppURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#83746b] transition-colors hover:text-[#6f4627]"
                        aria-label={t('cta.whatsapp')}
                    >
                        <Icon name="whatsapp" size={20} />
                    </a>
                </motion.div>
            </div>
        </div>
    );
}

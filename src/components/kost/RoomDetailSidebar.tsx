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

    return (
        <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="glass-card rounded-[1.5rem] p-6"
                >
                    <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-[#83746b]">
                        {t('pricing.packages')}
                    </h3>

                    {pricingRows.length > 0 ? (
                        <ul className="mb-6 space-y-3">
                            {pricingRows.map((pricing) => (
                                <li
                                    key={`${pricing.id}-${pricing.durationDays}`}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-[#f0e6dc] bg-[#faf9f6] px-4 py-3"
                                >
                                    <span className="text-sm text-[#83746b]">
                                        {getDurationLabel(pricing.durationDays, t)}
                                    </span>
                                    <span className="text-lg font-bold text-[#1a1c1a]">
                                        {formatCurrency(pricing.price)}
                                    </span>
                                </li>
                            ))}
                        </ul>
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

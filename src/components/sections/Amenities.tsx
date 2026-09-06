/**
 * Amenities Section Component
 * Displays key amenities in a dark, navy background section
 * Matches the 'LuxeLiving' design style
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/shared/Icon';

const amenityIds = ['wifi', 'ac', 'security', 'parking'] as const;

const amenityIcons: Record<(typeof amenityIds)[number], string> = {
    wifi: 'wifi',
    ac: 'ac_unit',
    security: 'security',
    parking: 'local_parking',
};

export function Amenities() {
    const t = useTranslations('home.amenities');

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <section
            id="amenities"
            className="relative w-full overflow-hidden bg-[#faf9f6] py-20 px-6 text-[#1a1c1a] lg:px-10"
        >
            {/* Background Gradients */}
            <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] -translate-y-1/2 translate-x-1/3 rounded-full bg-[#f5e4d4]/35 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-[380px] w-[380px] translate-y-1/3 -translate-x-1/3 rounded-full bg-[#e3e2e0]/40 blur-[100px]" />

            <div className="relative z-10 mx-auto max-w-[1080px]">
                <div className="mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-4 inline-flex items-center gap-2 rounded-full glass-chip-light px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#6f4627]"
                    >
                        <Icon name="star" size={14} filled />
                        <span>{t('badge')}</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="mb-4 text-3xl font-semibold tracking-tight text-[#1a1c1a] lg:text-4xl"
                    >
                        {t('title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mx-auto max-w-2xl text-base font-normal leading-relaxed text-[#51443c]"
                    >
                        {t('description')}
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid gap-5 sm:grid-cols-2 md:grid-cols-4"
                >
                    {amenityIds.map((id) => (
                        <motion.div
                            key={id}
                            variants={item}
                            whileHover={{ y: -5 }}
                            className="glass-card group flex flex-col items-center gap-5 rounded-[1.5rem] p-6 text-center transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="rounded-2xl bg-[#f5e4d4] p-3 text-[#6f4627] transition-colors duration-300 group-hover:bg-[#eed9c6]">
                                <Icon name={amenityIcons[id]} size={32} className="!text-3xl" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-base font-semibold text-[#1a1c1a]">
                                    {t(`items.${id}.title`)}
                                </h3>
                                <p className="text-sm font-normal leading-relaxed text-[#83746b]">
                                    {t(`items.${id}.description`)}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

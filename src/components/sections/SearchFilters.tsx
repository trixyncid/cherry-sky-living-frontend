/**
 * Search Filters Component
 * Filters aligned with GET /public/search query params
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Icon } from '@/components/shared/Icon';
import { listPublicProperties } from '@/lib/api/public/properties';
import { publicKeys } from '@/lib/query/keys';
import type { SearchFilters as SearchFiltersState } from '@/lib/types';

interface SearchFiltersProps {
    filters: SearchFiltersState;
    onFiltersChange: (filters: SearchFiltersState) => void;
    onReset?: () => void;
}

export function SearchFilters({ filters, onFiltersChange, onReset }: SearchFiltersProps) {
    const t = useTranslations();
    const [isExpanded, setIsExpanded] = useState(true);
    const [draftLocation, setDraftLocation] = useState(filters.location ?? '');
    const [draftPriceMin, setDraftPriceMin] = useState(filters.priceMin ?? 500_000);
    const [draftPriceMax, setDraftPriceMax] = useState(filters.priceMax ?? 2_500_000);

    const propertiesQuery = useQuery({
        queryKey: publicKeys.properties.all(),
        queryFn: listPublicProperties,
        staleTime: 5 * 60 * 1000,
    });

    const properties = propertiesQuery.data ?? [];

    useEffect(() => {
        setDraftLocation(filters.location ?? '');
        setDraftPriceMin(filters.priceMin ?? 500_000);
        setDraftPriceMax(filters.priceMax ?? 2_500_000);
    }, [
        filters.location,
        filters.priceMin,
        filters.priceMax,
        filters.availability,
        filters.propertyId,
        filters.durationDays,
        filters.sortBy,
    ]);

    const applyPending = (overrides?: Partial<SearchFiltersState>) => {
        onFiltersChange({
            ...filters,
            location: draftLocation.trim() || undefined,
            priceMin: draftPriceMin,
            priceMax: draftPriceMax,
            page: 1,
            ...overrides,
        });
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        applyPending();
    };

    const handleReset = () => {
        setDraftLocation('');
        setDraftPriceMin(500_000);
        setDraftPriceMax(2_500_000);
        onReset?.();
    };

    const applyImmediate = (patch: Partial<SearchFiltersState>) => {
        onFiltersChange({
            ...filters,
            location: draftLocation.trim() || undefined,
            priceMin: draftPriceMin,
            priceMax: draftPriceMax,
            ...patch,
            page: 1,
        });
    };

    const sortOptions = [
        { id: 'property-asc', label: t('search.sortProperty') },
        { id: 'price-asc', label: t('search.sortPriceAsc') },
        { id: 'price-desc', label: t('search.sortPriceDesc') },
        { id: 'newest', label: t('search.sortNewest') },
    ] as const;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="sticky top-24 z-40 rounded-2xl border border-[#e3e2e0] bg-white/90 p-6 shadow-sm"
        >
            <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[#1a1c1a]">
                    <Icon name="tune" size={20} />
                    {t('search.filtersTitle')}
                </h3>
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="rounded-xl p-2 transition-colors hover:bg-[#faf9f6] md:hidden"
                >
                    <Icon name={isExpanded ? 'expand_less' : 'expand_more'} size={20} />
                </button>
            </div>

            {isExpanded && (
                <form onSubmit={handleSubmit} className="space-y-0">
                    {/* Keyword */}
                    <div className="mb-8 border-b border-[#e3e2e0] pb-8">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#51443c]">
                            <Icon name="search" size={16} />
                            {t('search.location')}
                        </h4>
                        <input
                            type="search"
                            name="location"
                            value={draftLocation}
                            onChange={(e) => setDraftLocation(e.target.value)}
                            placeholder={t('search.placeholder')}
                            enterKeyHint="search"
                            className="w-full rounded-lg border border-[#e3e2e0] bg-[#faf9f6] px-3 py-2.5 text-sm text-[#1a1c1a] placeholder:text-[#83746b]/60 focus:border-[#6f4627] focus:outline-none focus:ring-2 focus:ring-[#6f4627]/25"
                        />
                    </div>

                    {/* Property */}
                    <div className="mb-8 border-b border-[#e3e2e0] pb-8">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#51443c]">
                            <Icon name="apartment" size={16} />
                            {t('search.propertyLabel')}
                        </h4>
                        <select
                            value={filters.propertyId ?? ''}
                            onChange={(e) =>
                                applyImmediate({
                                    propertyId: e.target.value || undefined,
                                })
                            }
                            className="w-full rounded-lg border border-[#e3e2e0] bg-[#faf9f6] px-3 py-2.5 text-sm text-[#1a1c1a] focus:border-[#6f4627] focus:outline-none focus:ring-2 focus:ring-[#6f4627]/25"
                        >
                            <option value="">{t('search.propertyAny')}</option>
                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Availability */}
                    <div className="mb-8 border-b border-[#e3e2e0] pb-8">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#51443c]">
                            <Icon name="event_available" size={16} />
                            {t('search.availability')}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {(
                                [
                                    { id: 'available', label: t('search.availabilityVacant') },
                                    { id: 'all', label: t('search.availabilityAll') },
                                ] as const
                            ).map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() =>
                                        applyImmediate({ availability: option.id })
                                    }
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                        (filters.availability ?? 'available') === option.id
                                            ? 'bg-[#6f4627] text-white'
                                            : 'bg-[#faf9f6] text-[#51443c] hover:bg-white'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rent duration */}
                    <div className="mb-8 border-b border-[#e3e2e0] pb-8">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#51443c]">
                            <Icon name="calendar_month" size={16} />
                            {t('search.durationLabel')}
                        </h4>
                        <select
                            value={filters.durationDays?.toString() ?? ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                applyImmediate({
                                    durationDays: value ? Number(value) : undefined,
                                });
                            }}
                            className="w-full rounded-lg border border-[#e3e2e0] bg-[#faf9f6] px-3 py-2.5 text-sm text-[#1a1c1a] focus:border-[#6f4627] focus:outline-none focus:ring-2 focus:ring-[#6f4627]/25"
                        >
                            <option value="">{t('search.durationAny')}</option>
                            <option value="30">{t('search.duration30')}</option>
                        </select>
                    </div>

                    {/* Price range */}
                    <div className="mb-8 border-b border-[#e3e2e0] pb-8">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#51443c]">
                            <Icon name="local_offer" size={16} />
                            {t('search.priceRange')}
                        </h4>
                        <div className="space-y-4">
                            <Slider
                                value={[draftPriceMin, draftPriceMax]}
                                min={500000}
                                max={5000000}
                                step={100000}
                                onValueChange={(values) => {
                                    setDraftPriceMin(values[0]);
                                    setDraftPriceMax(values[1]);
                                }}
                                onValueCommit={(values) => {
                                    applyImmediate({
                                        priceMin: values[0],
                                        priceMax: values[1],
                                    });
                                }}
                                className="w-full"
                            />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[#83746b]">
                                    Rp {(draftPriceMin / 1_000_000).toFixed(1)}M
                                </span>
                                <span className="text-[#83746b]">
                                    Rp {(draftPriceMax / 1_000_000).toFixed(1)}M+
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="mb-6 border-b border-[#e3e2e0] pb-6">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#51443c]">
                            <Icon name="sort" size={16} />
                            {t('search.sortLabel')}
                        </h4>
                        <div className="space-y-2">
                            {sortOptions.map((option) => (
                                <button
                                    type="button"
                                    key={option.id}
                                    onClick={() => applyImmediate({ sortBy: option.id })}
                                    className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-all ${
                                        (filters.sortBy ?? 'property-asc') === option.id
                                            ? 'bg-[#6f4627] text-white'
                                            : 'bg-[#faf9f6] text-[#51443c] hover:bg-white'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            onClick={handleReset}
                            variant="outline"
                            className="flex-1 rounded-xl border-[#e3e2e0] bg-white/80 text-[#1a1c1a] hover:bg-white hover:text-[#6f4627]"
                        >
                            <Icon name="restart_alt" size={16} className="mr-2" />
                            {t('search.reset')}
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 rounded-xl bg-[#6f4627] text-white hover:bg-[#805533]"
                        >
                            <Icon name="search" size={16} className="mr-2" />
                            {t('search.apply')}
                        </Button>
                    </div>
                </form>
            )}
        </motion.div>
    );
}

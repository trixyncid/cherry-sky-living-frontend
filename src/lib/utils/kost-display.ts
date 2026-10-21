import type { RoomType } from '@/lib/types';

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

export function getDurationLabel(durationDays: number, t: TranslateFn): string {
    const known: Record<number, string> = {
        1: t('search.duration1'),
        7: t('search.duration7'),
        12: t('search.duration12'),
        30: t('search.duration30'),
    };
    return known[durationDays] ?? t('search.durationDaysCount', { days: durationDays });
}

/** Available room types first, then by lowest price. */
export function sortRoomTypesForDisplay(roomTypes: RoomType[]): RoomType[] {
    return [...roomTypes].sort((a, b) => {
        const aAvailable = a.availableCount > 0 ? 0 : 1;
        const bAvailable = b.availableCount > 0 ? 0 : 1;
        if (aAvailable !== bAvailable) return aAvailable - bAvailable;
        return a.price - b.price;
    });
}

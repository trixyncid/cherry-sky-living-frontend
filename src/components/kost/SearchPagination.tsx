'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/shared/Icon';
import { cn } from '@/lib/utils';
import type { PublicSearchPagination } from '@/lib/api/public/search';

interface SearchPaginationProps {
    pagination: PublicSearchPagination;
    onPageChange: (page: number) => void;
}

function buildPageNumbers(
    current: number,
    total: number,
): Array<number | 'ellipsis'> {
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
        return [1, 2, 3, 'ellipsis', total];
    }
    if (current >= total - 2) {
        return [1, 'ellipsis', total - 2, total - 1, total];
    }
    return [1, 'ellipsis', current, 'ellipsis', total];
}

export function SearchPagination({ pagination, onPageChange }: SearchPaginationProps) {
    const t = useTranslations('search');
    const { page, pageSize, total, totalPages } = pagination;

    if (totalPages <= 1) return null;

    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    const pages = buildPageNumbers(page, totalPages);

    return (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#e3e2e0] bg-white/80 px-4 py-4 sm:flex-row sm:px-6">
            <p className="text-xs font-medium text-[#83746b]">
                {t('paginationShowing', { start, end, total })}
            </p>
            <div className="flex gap-1">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="rounded-lg p-1.5 text-[#51443c] transition-colors hover:bg-[#1a1c1a]/8 disabled:opacity-40"
                    aria-label={t('paginationPrevious')}
                >
                    <Icon name="chevron_left" size={20} />
                </button>
                {pages.map((p, i) =>
                    p === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="flex size-8 items-center justify-center text-[#83746b]"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={cn(
                                'flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                                p === page
                                    ? 'bg-[#1a1c1a] text-white'
                                    : 'text-[#1a1c1a] hover:bg-[#1a1c1a]/8',
                            )}
                        >
                            {p}
                        </button>
                    ),
                )}
                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="rounded-lg p-1.5 text-[#51443c] transition-colors hover:bg-[#1a1c1a]/8 disabled:opacity-40"
                    aria-label={t('paginationNext')}
                >
                    <Icon name="chevron_right" size={20} />
                </button>
            </div>
        </div>
    );
}

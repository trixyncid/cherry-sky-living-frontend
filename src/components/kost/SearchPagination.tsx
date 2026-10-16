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
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[1.25rem] bg-white px-4 py-3 sm:flex-row sm:px-5">
            <p className="text-sm font-medium text-[#6b6b6b]">
                {t('paginationShowing', { start, end, total })}
            </p>
            <div className="flex gap-1">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="flex size-10 items-center justify-center rounded-full text-[#141414] transition-colors hover:bg-[#f7f3f2] disabled:opacity-40"
                    aria-label={t('paginationPrevious')}
                >
                    <Icon name="chevron_left" size={20} />
                </button>
                {pages.map((p, i) =>
                    p === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="flex size-10 items-center justify-center text-[#6b6b6b]"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={cn(
                                'flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                                p === page
                                    ? 'bg-[#71130d] text-white'
                                    : 'text-[#141414] hover:bg-[#f7f3f2]',
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
                    className="flex size-10 items-center justify-center rounded-full text-[#141414] transition-colors hover:bg-[#f7f3f2] disabled:opacity-40"
                    aria-label={t('paginationNext')}
                >
                    <Icon name="chevron_right" size={20} />
                </button>
            </div>
        </div>
    );
}

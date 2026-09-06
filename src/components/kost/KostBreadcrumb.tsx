'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Icon } from '@/components/shared/Icon';
import { cn } from '@/lib/utils';

export interface KostBreadcrumbItem {
    label: string;
    href?: string;
}

interface KostBreadcrumbProps {
    items: KostBreadcrumbItem[];
    className?: string;
    tone?: 'default' | 'onDark';
}

export function KostBreadcrumb({
    items,
    className,
    tone = 'default',
}: KostBreadcrumbProps) {
    const onDark = tone === 'onDark';

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn('flex flex-wrap items-center gap-1.5 text-sm', className)}
        >
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
                        {index > 0 && (
                            <Icon
                                name="chevron_right"
                                size={16}
                                className={cn(
                                    'shrink-0',
                                    onDark ? 'text-white/40' : 'text-[#b0a29a]',
                                )}
                            />
                        )}
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className={cn(
                                    'font-medium transition-colors',
                                    onDark
                                        ? 'text-white/70 hover:text-white'
                                        : 'text-[#83746b] hover:text-[#6f4627]',
                                )}
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span
                                className={cn(
                                    'font-medium',
                                    isLast
                                        ? onDark
                                            ? 'text-white'
                                            : 'text-[#1a1c1a]'
                                        : onDark
                                          ? 'text-white/70'
                                          : 'text-[#83746b]',
                                )}
                                aria-current={isLast ? 'page' : undefined}
                            >
                                {item.label}
                            </span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}

export function useKostBreadcrumbs() {
    const t = useTranslations('propertyDetail');

    return {
        home: { label: t('breadcrumbHome'), href: '/' },
        search: { label: t('breadcrumbSearch'), href: '/search-kosts' },
        property: (name: string, id: string) => ({
            label: name,
            href: `/kosts/${id}`,
        }),
        unitType: (name: string) => ({ label: name }),
    };
}

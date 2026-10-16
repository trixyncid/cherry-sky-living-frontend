/**
 * Navbar Component
 * Sticky header: brand, page links, persistent "Check availability" CTA
 * (landing-page-instructions §5.1). Compact header + menu on smaller screens.
 */

'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
    CHECK_AVAILABILITY_HREF,
    PUBLIC_NAV_LINKS,
    type PublicNavLink,
} from '@/components/layout/nav-links';
import { ArrowPill } from '@/components/shared/ArrowPill';
import { BrandMark } from '@/components/shared/BrandMark';
import { Icon } from '@/components/shared/Icon';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface NavbarProps {
    onMenuClick?: () => void;
}

/** Routes that open on a dark photo hero (homepage hero or PageHero). */
const DARK_HERO_PATHS = new Set([
    '/',
    '/search-kosts',
    '/residences',
    '/facilities',
    '/location',
    '/faq',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
]);

function normalizePath(pathname: string) {
    return pathname.replace(/^\/(en|id)(?=\/|$)/, '') || '/';
}

interface NavbarLinkProps {
    link: PublicNavLink;
    label: string;
    isActive: boolean;
    isSolid: boolean;
}

function NavbarLink({ link, label, isActive, isSolid }: NavbarLinkProps) {
    return (
        <Link
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                'px-3 py-2 text-[15px] font-medium transition-colors duration-200 xl:px-3.5',
                isActive
                    ? isSolid
                        ? 'text-[#71130d]'
                        : 'text-white underline decoration-[#f3dedb] decoration-2 underline-offset-8'
                    : isSolid
                      ? 'text-[#141414] hover:text-[#71130d]'
                      : 'text-[#faf9f6]/80 hover:text-white',
            )}
        >
            {label}
        </Link>
    );
}

export function Navbar({ onMenuClick }: NavbarProps) {
    const t = useTranslations();
    const pathname = usePathname() ?? '';
    const current = normalizePath(pathname);
    // Pages that open on a dark photo hero: stay transparent over it until
    // the visitor scrolls. Detail pages keep a light header.
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    const isSolid = !DARK_HERO_PATHS.has(current) || scrolled;


    const isLinkActive = (link: PublicNavLink) =>
        current === link.href ||
        current.startsWith(`${link.href}/`) ||
        // Room detail pages belong to "Rooms".
        (link.key === 'rooms' && current.startsWith('/kosts'));

    return (
        <motion.nav
            initial={false}
            className={cn(
                'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
                isSolid
                    ? 'border-b border-[#e7e4df] bg-[#f7f3f2]/90 backdrop-blur-md'
                    : 'border-b border-white/10 bg-transparent',
            )}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-3">
                    <Link
                        href="/"
                        className="flex min-w-0 shrink-0 items-center"
                        aria-label={t('common.brand.fullName')}
                    >
                        <BrandMark
                            variant="nav"
                            tone={isSolid ? 'onLight' : 'onDark'}
                            className={cn(
                                'h-8 w-[9.5rem] transition-opacity duration-300 sm:h-9 sm:w-[11rem]',
                                !isSolid && 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]',
                            )}
                        />
                    </Link>

                    <div className="hidden items-center lg:flex">
                        {PUBLIC_NAV_LINKS.map((link) => (
                            <NavbarLink
                                key={link.key}
                                link={link}
                                label={t(`nav.${link.key}`)}
                                isActive={isLinkActive(link)}
                                isSolid={isSolid}
                            />
                        ))}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <LanguageSwitcher variant="navbar" isSolid={isSolid} />

                        <Link
                            href="/tenant/login"
                            aria-label={t('tenant.portalName')}
                            title={t('tenant.portalName')}
                            className={cn(
                                'hidden size-9 items-center justify-center rounded-full border transition-colors duration-300 xl:inline-flex',
                                isSolid
                                    ? 'border-[#e3e2e0] text-[#71130d] hover:border-[#d5c3b8] hover:bg-[#f5e4d4]/60'
                                    : 'border-white/30 text-white hover:bg-white/15',
                            )}
                        >
                            <Icon name="person" size={18} />
                        </Link>

                        <ArrowPill
                            href={CHECK_AVAILABILITY_HREF}
                            tone={isSolid ? 'dark' : 'light'}
                            className="hidden h-11 text-sm sm:inline-flex"
                        >
                            {t('nav.checkAvailability')}
                        </ArrowPill>

                        <button
                            type="button"
                            onClick={onMenuClick}
                            className={cn(
                                'rounded-xl p-2 transition-colors duration-300 lg:hidden',
                                isSolid
                                    ? 'text-[#1a1c1a] hover:bg-[#f5e4d4]/70 hover:text-[#71130d]'
                                    : 'text-[#faf9f6] hover:bg-white/15 hover:text-white',
                            )}
                            aria-label={t('common.openMenu')}
                        >
                            <Icon name="menu" size={22} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}

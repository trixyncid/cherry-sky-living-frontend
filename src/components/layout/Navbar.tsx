/**
 * Navbar Component
 * Responsive navigation with mobile and desktop variants
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Icon } from '@/components/shared/Icon';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface NavbarProps {
    onMenuClick?: () => void;
}

interface NavLink {
    href: string;
    label: string;
}

/** Pages with a full-width dark hero behind the navbar. */
function hasHeroOverlay(pathname: string) {
    return (
        /^\/(en|id)\/?$/.test(pathname) ||
        /^\/(en|id)\/(about|contact|search-kosts|terms|privacy)\/?$/.test(pathname) ||
        /^\/(en|id)\/kosts(\/|$)/.test(pathname)
    );
}

function normalizePath(pathname: string) {
    return pathname.replace(/^\/(en|id)(?=\/|$)/, '') || '/';
}

function isNavActive(pathname: string, href: string) {
    const current = normalizePath(pathname);
    if (href === '/') return current === '/' || current === '';
    return current === href || current.startsWith(`${href}/`);
}

interface NavbarLinkProps {
    href: string;
    label: string;
    pathname: string;
    isSolid: boolean;
}

function NavbarLink({ href, label, pathname, isSolid }: NavbarLinkProps) {
    const isActive = isNavActive(pathname, href);

    return (
        <Link
            href={href}
            className={cn(
                'group relative px-5 py-2 text-sm transition-colors duration-200 lg:px-6',
                isActive
                    ? cn(
                          'font-semibold',
                          isSolid ? 'text-[#6f4627]' : 'text-white',
                      )
                    : cn(
                          'font-medium',
                          isSolid
                              ? 'text-[#83746b] hover:text-[#1a1c1a]'
                              : 'text-[#faf9f6]/75 hover:text-white',
                      ),
            )}
        >
            {label}
            {isActive ? (
                <motion.span
                    layoutId="navbar-active-line"
                    className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-ferrugem"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
            ) : (
                <span
                    aria-hidden
                    className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-ferrugem opacity-0 transition-all duration-300 ease-out group-hover:w-4 group-hover:opacity-50"
                />
            )}
        </Link>
    );
}

interface NavbarLinksProps {
    links: NavLink[];
    pathname: string;
    isSolid: boolean;
}

function NavbarLinks({ links, pathname, isSolid }: NavbarLinksProps) {
    return (
        <div className="hidden items-center gap-1 md:flex lg:gap-2">
            {links.map((link) => (
                <NavbarLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    pathname={pathname}
                    isSolid={isSolid}
                />
            ))}
        </div>
    );
}

export function Navbar({ onMenuClick }: NavbarProps) {
    const t = useTranslations();
    const pathname = usePathname() ?? '';
    const [isScrolled, setIsScrolled] = useState(false);
    const isSolid = isScrolled || !hasHeroOverlay(pathname);

    const navLinks: NavLink[] = [
        { href: '/', label: t('nav.home') },
        { href: '/about', label: t('nav.about') },
        { href: '/search-kosts', label: t('nav.search') },
        { href: '/contact', label: t('nav.contact') },
    ];

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
                isSolid ? 'glass-nav' : 'glass-nav-hero',
            )}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-3">
                    {/* Left: logo */}
                    <div className="flex min-w-0 items-center gap-2">
                        <Link href="/" className="group flex min-w-0 items-center gap-2">
                            <motion.div
                                whileHover={{ scale: 1.06, rotate: -2 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                className={cn(
                                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-shadow duration-300',
                                    isSolid
                                        ? 'bg-[#6f4627] group-hover:shadow-[0_4px_16px_rgba(111,70,39,0.35)]'
                                        : 'bg-white/10 ring-1 ring-white/25 group-hover:bg-white/18',
                                )}
                            >
                                <Icon
                                    name="apartment"
                                    size={20}
                                    className="text-white"
                                />
                            </motion.div>
                            <span
                                className={cn(
                                    'truncate text-lg font-bold tracking-tight transition-colors duration-300',
                                    isSolid
                                        ? 'text-[#1a1c1a] group-hover:text-[#6f4627]'
                                        : 'text-[#faf9f6] drop-shadow-lg group-hover:text-white',
                                )}
                            >
                                {t('common.brand.name')}
                            </span>
                        </Link>
                    </div>

                    {/* Center: desktop nav */}
                    <NavbarLinks links={navLinks} pathname={pathname} isSolid={isSolid} />

                    {/* Right: actions */}
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <LanguageSwitcher variant="navbar" isSolid={isSolid} />

                        <motion.button
                            type="button"
                            onClick={onMenuClick}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                'rounded-xl p-2 transition-colors duration-300 md:hidden',
                                isSolid
                                    ? 'text-[#1a1c1a] hover:bg-[#f5e4d4]/70 hover:text-[#6f4627]'
                                    : 'text-[#faf9f6] hover:bg-white/15 hover:text-white',
                            )}
                            aria-label={t('common.openMenu')}
                        >
                            <Icon name="menu" size={22} />
                        </motion.button>

                        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                href="/tenant/login"
                                className={cn(
                                    'group/portal hidden h-9 items-center gap-2 border px-4 text-sm font-semibold transition-all duration-300 sm:inline-flex',
                                    isSolid
                                        ? 'glass-chip-light rounded-xl text-[#6f4627] hover:border-[#8b5e3c]/55 hover:bg-[#f5e4d4]/75'
                                        : 'rounded-full border-white/35 bg-transparent text-white hover:border-white/60 hover:bg-white/10',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-300',
                                        isSolid
                                            ? 'bg-[#f5e4d4]/80 text-[#6f4627] group-hover/portal:bg-[#6f4627] group-hover/portal:text-white'
                                            : 'bg-white/10 text-white group-hover/portal:bg-white/20',
                                    )}
                                >
                                    <Icon name="login" size={15} />
                                </span>
                                {t('tenant.portalName')}
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>

        </motion.nav>
    );
}

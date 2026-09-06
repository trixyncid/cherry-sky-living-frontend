/**
 * Sidebar Component
 * Mobile drawer navigation menu
 */

'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@/components/shared/Icon';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

interface SidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface MenuItemProps {
    href: string;
    icon: string;
    label: string;
    onClick?: () => void;
}

function MenuItem({ href, icon, label, onClick }: MenuItemProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[#faf9f6]"
        >
            <Icon
                name={icon}
                size={24}
                className="text-[#83746b] group-hover:text-[#6f4627]"
            />
            <span className="text-sm font-medium text-[#1a1c1a] group-hover:text-[#6f4627]">
                {label}
            </span>
        </Link>
    );
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
    const t = useTranslations();

    const handleClose = () => onOpenChange(false);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="glass-card w-[280px] p-0 text-[#1a1c1a] sm:w-[320px]">
                <SheetHeader className="p-6 pb-4">
                    <SheetTitle className="flex items-center gap-2 text-left">
                        <div className="text-[#6f4627]">
                            <Icon name="apartment" size={28} />
                        </div>
                        <span className="text-xl font-bold">{t('common.brand.name')}</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="px-3 pb-6 overflow-y-auto h-[calc(100vh-80px)]">
                    {/* Main Navigation */}
                    <div className="space-y-1 mb-6">
                        <MenuItem
                            href="/"
                            icon="home"
                            label={t('nav.home')}
                            onClick={handleClose}
                        />
                        <MenuItem
                            href="/about"
                            icon="info"
                            label={t('nav.about')}
                            onClick={handleClose}
                        />
                        <MenuItem
                            href="/search-kosts"
                            icon="search"
                            label={t('nav.search')}
                            onClick={handleClose}
                        />
                    </div>

                    <Separator className="my-4" />

                    {/* Account Section */}
                    <div className="space-y-1">
                        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#83746b]">
                            {t('common.accountSection')}
                        </p>
                        <MenuItem
                            href="/tenant/login"
                            icon="person"
                            label={t('nav.account')}
                            onClick={handleClose}
                        />
                        <MenuItem
                            href="/tenant/login"
                            icon="login"
                            label={t('nav.login')}
                            onClick={handleClose}
                        />
                    </div>

                    <Separator className="my-4" />

                    {/* Help & Info */}
                    <div className="space-y-1">
                        <MenuItem
                            href="/contact"
                            icon="call"
                            label={t('nav.contact')}
                            onClick={handleClose}
                        />
                    </div>

                    <Separator className="my-4" />

                    {/* Language Switcher */}
                    <div className="pt-4">
                        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-[#83746b]">
                            {t('common.language')}
                        </p>
                        <LanguageSwitcher variant="sidebar" />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

/**
 * Language Switcher Component
 * Interactive language switcher with flag emojis and smooth animations
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/shared/Icon';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
    variant?: 'navbar' | 'sidebar';
    /** When true, navbar trigger uses styles for a light/solid navbar background. */
    isSolid?: boolean;
}

interface Language {
    code: string;
    name: string;
    /** ISO 3166-1 alpha-2 country code for flag-icons (fi fi-XX) */
    countryCode: string;
}

const LANGUAGES: Language[] = [
    { code: 'id', name: 'Bahasa Indonesia', countryCode: 'id' },
    { code: 'en', name: 'English', countryCode: 'us' },
];

export function LanguageSwitcher({ variant = 'navbar', isSolid = true }: LanguageSwitcherProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLanguage = LANGUAGES.find((lang) => lang.code === locale) ?? LANGUAGES[0];

    const handleLanguageChange = (langCode: string) => {
        if (langCode !== locale) {
            const pathWithoutLocale = pathname.replace(`/${locale}`, '');
            router.push(`/${langCode}${pathWithoutLocale || '/'}`);
        }
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger — flag only */}
            <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Current language: ${currentLanguage.name}. Click to change.`}
                aria-expanded={isOpen}
                className={cn(
                    'flex items-center justify-center rounded-xl transition-all duration-300',
                    variant === 'navbar'
                        ? cn('h-9 w-9', isSolid ? 'hover:bg-white/70' : 'hover:bg-white/15')
                        : 'h-10 w-10 hover:bg-[#faf9f6]',
                )}
            >
                <span className={`fi fi-${currentLanguage.countryCode} text-xl`} />
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="glass-overlay absolute right-0 top-full z-[80] mt-2 w-44 overflow-hidden rounded-xl p-1.5"
                    >
                        <div className="space-y-0.5">
                            {LANGUAGES.map((language) => {
                                const isActive = language.code === locale;
                                return (
                                    <button
                                        key={language.code}
                                        type="button"
                                        onClick={() => handleLanguageChange(language.code)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'admin-btn-primary'
                                                : 'text-[#1a1c1a] hover:bg-[#f6f1ec]',
                                        )}
                                    >
                                        <span className={`fi fi-${language.countryCode} text-xl`} />
                                        <span className="flex-1 text-left">{language.name}</span>
                                        {isActive && (
                                            <Icon name="check" size={16} className="shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

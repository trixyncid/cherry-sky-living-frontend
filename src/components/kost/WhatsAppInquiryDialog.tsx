/**
 * WhatsApp Inquiry Dialog
 * Collects tenant details before redirecting to WhatsApp with a pre-filled message.
 */

'use client';

import { useMemo, useState } from 'react';
import { track } from '@/lib/analytics';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/date-picker';
import { Icon } from '@/components/shared/Icon';
import { RequiredMark } from '@/components/shared/required-mark';
import { formatDate } from '@/features/admin/lib/format';
import type { RoomTypePricing } from '@/lib/types';
import { BOOKING_DEPOSIT_AMOUNT } from '@/lib/constants/booking';
import { formatCurrency, generateWhatsAppURL } from '@/lib/utils/format';
import { getDurationLabel } from '@/lib/utils/kost-display';
import { cn } from '@/lib/utils';

interface WhatsAppInquiryDialogProps {
    phoneNumber: string;
    propertyName: string;
    roomName: string;
    pricings: RoomTypePricing[];
    fallbackPrice?: number;
    variant?: 'default' | 'compact' | 'icon';
    className?: string;
    label?: string;
    disabled?: boolean;
}

interface FormState {
    name: string;
    phone: string;
    durationDays: string;
    checkInDate: string;
}

interface FormErrors {
    name?: string;
    phone?: string;
    durationDays?: string;
    checkInDate?: string;
}

const inputClassName =
    'w-full rounded-xl border border-[#cfc5c1] bg-white px-4 py-3 text-[#1a1c1a] transition-colors placeholder:text-[#6b6b6b] focus:border-[#8a1a12]/60 focus:outline-none focus:ring-2 focus:ring-[#8a1a12]/15';

const selectClassName =
    'w-full appearance-none rounded-xl border border-[#cfc5c1] bg-white py-3 pl-4 pr-10 text-[#1a1c1a] transition-colors focus:border-[#8a1a12]/60 focus:outline-none focus:ring-2 focus:ring-[#8a1a12]/15';

const inputErrorClassName = 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/15';

export function WhatsAppInquiryDialog({
    phoneNumber,
    propertyName,
    roomName,
    pricings,
    fallbackPrice = 0,
    variant = 'default',
    className,
    label,
    disabled = false,
}: WhatsAppInquiryDialogProps) {
    const t = useTranslations();
    const locale = useLocale();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<FormState>({
        name: '',
        phone: '',
        durationDays: '',
        checkInDate: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});

    const durationOptions = useMemo(() => {
        if (pricings.length > 0) {
            return pricings;
        }
        if (fallbackPrice > 0) {
            return [{ id: 'fallback', durationDays: 30, price: fallbackPrice }];
        }
        return [];
    }, [pricings, fallbackPrice]);

    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    const resetForm = () => {
        setForm({ name: '', phone: '', durationDays: '', checkInDate: '' });
        setErrors({});
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            resetForm();
        } else if (durationOptions.length === 1) {
            setForm((prev) => ({
                ...prev,
                durationDays: String(durationOptions[0].durationDays),
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleCheckInDateChange = (value: string) => {
        setForm((prev) => ({ ...prev, checkInDate: value }));
        if (errors.checkInDate) {
            setErrors((prev) => ({ ...prev, checkInDate: undefined }));
        }
    };

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};

        if (!form.name.trim()) {
            nextErrors.name = t('whatsapp.inquiryDialog.required');
        }
        if (!form.phone.trim()) {
            nextErrors.phone = t('whatsapp.inquiryDialog.required');
        } else if (!/^[\d\s+\-()]{8,}$/.test(form.phone.trim())) {
            nextErrors.phone = t('whatsapp.inquiryDialog.invalidPhone');
        }
        if (!form.durationDays) {
            nextErrors.durationDays = t('whatsapp.inquiryDialog.required');
        }
        if (!form.checkInDate) {
            nextErrors.checkInDate = t('whatsapp.inquiryDialog.required');
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const durationDays = Number(form.durationDays);
        const durationLabel = getDurationLabel(durationDays, t);
        const selectedPricing = durationOptions.find((p) => p.durationDays === durationDays);
        const durationWithPrice = selectedPricing
            ? `${durationLabel} - ${formatCurrency(selectedPricing.price)}`
            : durationLabel;
        const deposit = formatCurrency(BOOKING_DEPOSIT_AMOUNT);
        const formattedCheckInDate = formatDate(form.checkInDate, locale);

        const message = t('whatsapp.inquiryDialog.bookingMessage', {
            roomType: roomName,
            propertyName,
            name: form.name.trim(),
            phone: form.phone.trim(),
            duration: durationWithPrice,
            checkInDate: formattedCheckInDate,
            deposit,
        });

        track('click_whatsapp', { location: 'room_inquiry_dialog', property: propertyName });
        window.open(generateWhatsAppURL(phoneNumber, message), '_blank', 'noopener,noreferrer');
        setOpen(false);
        resetForm();
    };

    const triggerLabel = label ?? t('cta.sendInquiry');

    const triggerButton =
        variant === 'icon' ? (
            <button
                type="button"
                disabled={disabled}
                aria-label={triggerLabel}
                className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition-colors hover:bg-[#1fb855] disabled:cursor-not-allowed disabled:opacity-60',
                    className,
                )}
            >
                <Icon name="whatsapp" size={16} />
            </button>
        ) : variant === 'compact' ? (
            <button
                type="button"
                disabled={disabled}
                className={cn(
                    'inline-flex items-center gap-2 bg-[#71130d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5c0f0a] disabled:cursor-not-allowed disabled:opacity-60',
                    className,
                )}
            >
                <Icon name="whatsapp" size={16} />
                <span>{triggerLabel}</span>
            </button>
        ) : (
            <Button
                type="button"
                disabled={disabled}
                className={cn(
                    'bg-[#71130d] font-semibold text-white hover:bg-[#5c0f0a]',
                    className,
                )}
            >
                <Icon name="whatsapp" size={18} className="mr-2" />
                {triggerLabel}
            </Button>
        );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('whatsapp.inquiryDialog.title')}</DialogTitle>
                    <DialogDescription>{t('whatsapp.inquiryDialog.description')}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="inquiry-name" className="mb-2 block text-sm font-semibold text-[#1a1c1a]">
                            {t('whatsapp.inquiryDialog.name')}
                            <RequiredMark className="ml-0.5" />
                        </label>
                        <input
                            id="inquiry-name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder={t('whatsapp.inquiryDialog.namePlaceholder')}
                            className={cn(inputClassName, errors.name && inputErrorClassName)}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="inquiry-phone" className="mb-2 block text-sm font-semibold text-[#1a1c1a]">
                            {t('whatsapp.inquiryDialog.phone')}
                            <RequiredMark className="ml-0.5" />
                        </label>
                        <input
                            id="inquiry-phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder={t('whatsapp.inquiryDialog.phonePlaceholder')}
                            className={cn(inputClassName, errors.phone && inputErrorClassName)}
                        />
                        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                    </div>

                    <div>
                        <label
                            htmlFor="inquiry-duration"
                            className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
                        >
                            {t('whatsapp.inquiryDialog.duration')}
                            <RequiredMark className="ml-0.5" />
                        </label>
                        <div className="relative">
                            <select
                                id="inquiry-duration"
                                name="durationDays"
                                value={form.durationDays}
                                onChange={handleChange}
                                className={cn(selectClassName, errors.durationDays && inputErrorClassName)}
                            >
                                <option value="">{t('whatsapp.inquiryDialog.durationPlaceholder')}</option>
                                {durationOptions.map((pricing) => (
                                    <option key={`${pricing.id}-${pricing.durationDays}`} value={pricing.durationDays}>
                                        {getDurationLabel(pricing.durationDays, t)} — {formatCurrency(pricing.price)}
                                    </option>
                                ))}
                            </select>
                            <Icon
                                name="expand_more"
                                size={20}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#83746b]"
                            />
                        </div>
                        {errors.durationDays && (
                            <p className="mt-1 text-xs text-red-500">{errors.durationDays}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="inquiry-check-in"
                            className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
                        >
                            {t('whatsapp.inquiryDialog.checkInDate')}
                            <RequiredMark className="ml-0.5" />
                        </label>
                        <DatePicker
                            id="inquiry-check-in"
                            value={form.checkInDate}
                            onChange={handleCheckInDateChange}
                            fromDate={today}
                            placeholder={t('whatsapp.inquiryDialog.checkInDatePlaceholder')}
                            popoverClassName="z-[60]"
                            className={cn(
                                'h-auto rounded-xl border-[#e3e2e0] bg-white px-4 py-3 text-sm hover:border-[#c4b0a4] focus:border-[#8a1a12]/60 focus:bg-white focus:ring-[#8a1a12]/15',
                                !form.checkInDate && 'text-[#6b6b6b]',
                                errors.checkInDate && inputErrorClassName,
                            )}
                        />
                        {errors.checkInDate && (
                            <p className="mt-1 text-xs text-red-500">{errors.checkInDate}</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-[#f0e6dc] bg-[#faf9f6] px-4 py-3">
                        <p className="text-sm text-[#51443c]">
                            {t('whatsapp.inquiryDialog.depositNote', {
                                amount: formatCurrency(BOOKING_DEPOSIT_AMOUNT),
                            })}
                        </p>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="submit"
                            className="w-full bg-[#25D366] font-semibold text-white hover:bg-[#1fb855] sm:w-auto"
                        >
                            <Icon name="whatsapp" size={18} className="mr-2" />
                            {t('whatsapp.inquiryDialog.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

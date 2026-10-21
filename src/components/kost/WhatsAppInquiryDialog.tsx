/**
 * WhatsApp Inquiry Dialog
 * Collects tenant details and when they want to visit, opens WhatsApp with a
 * pre-filled message and saves
 * a reservation lead so the owner sees it in the leads inbox even if the
 * visitor never presses send in WhatsApp.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { Icon } from "@/components/shared/Icon";
import { RequiredMark } from "@/components/shared/required-mark";
import { SelectMenu } from "@/components/shared/select-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/features/admin/lib/format";
import { getLeadSource, track } from "@/lib/analytics";
import { createLead } from "@/lib/api/public/leads";
import {
  isViewingDayClosed,
  VIEWING_TIMES,
  viewingDateTime,
} from "@/lib/constants/booking";
import { cn } from "@/lib/utils";
import { formatCurrency, generateWhatsAppURL } from "@/lib/utils/format";

interface WhatsAppInquiryDialogProps {
  phoneNumber: string;
  propertyName: string;
  roomName: string;
  /** Saved on the lead so the owner knows which room it's about. */
  propertyId?: string;
  unitTypeId?: string;
  /** The property's refundable deposit (Rp); omitted when not set. */
  deposit?: number;
  variant?: "default" | "compact" | "icon";
  className?: string;
  label?: string;
  disabled?: boolean;
}

interface FormState {
  name: string;
  phone: string;
  visitDate: string;
  visitTime: string;
  checkInDate: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  phone: "",
  visitDate: "",
  visitTime: "",
  checkInDate: "",
};

const timeOptions = VIEWING_TIMES.map((time) => ({
  value: time,
  label: `${time} WIB`,
}));

const inputClassName =
  "w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-fg transition-colors placeholder:text-fg-muted focus:border-brand-hover/60 focus:outline-none focus:ring-2 focus:ring-brand-hover/15";

const inputErrorClassName =
  "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/15";

export function WhatsAppInquiryDialog({
  phoneNumber,
  propertyName,
  roomName,
  propertyId,
  unitTypeId,
  deposit,
  variant = "default",
  className,
  label,
  disabled = false,
}: WhatsAppInquiryDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const setField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = t("whatsapp.inquiryDialog.required");
    }
    if (!form.phone.trim()) {
      nextErrors.phone = t("whatsapp.inquiryDialog.required");
    } else if (!/^[\d\s+\-()]{8,}$/.test(form.phone.trim())) {
      nextErrors.phone = t("whatsapp.inquiryDialog.invalidPhone");
    }
    if (!form.visitDate) {
      nextErrors.visitDate = t("whatsapp.inquiryDialog.required");
    } else {
      const day = new Date(`${form.visitDate}T00:00:00`);
      if (
        Number.isNaN(day.getTime()) ||
        day < today ||
        isViewingDayClosed(day)
      ) {
        nextErrors.visitDate = t("whatsapp.inquiryDialog.invalidVisitDate");
      }
    }
    if (!form.visitTime) {
      nextErrors.visitTime = t("whatsapp.inquiryDialog.required");
    }
    if (!form.checkInDate) {
      nextErrors.checkInDate = t("whatsapp.inquiryDialog.required");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const visitDay = formatDate(form.visitDate, locale);
    const formattedCheckInDate = formatDate(form.checkInDate, locale);

    const message = t("whatsapp.inquiryDialog.bookingMessage", {
      roomType: roomName,
      propertyName,
      name: form.name.trim(),
      phone: form.phone.trim(),
      visitDay,
      visitTime: form.visitTime,
      checkInDate: formattedCheckInDate,
      hasDeposit: deposit ? "yes" : "no",
      deposit: deposit ? formatCurrency(deposit) : "",
    });

    track("click_whatsapp", {
      location: "room_inquiry_dialog",
      property: propertyName,
    });
    // Open WhatsApp synchronously (popup blockers), then save the lead in
    // the background — WhatsApp already carries the request.
    window.open(
      generateWhatsAppURL(phoneNumber, message),
      "_blank",
      "noopener,noreferrer",
    );
    createLead({
      type: "reservation",
      name: form.name.trim(),
      phone: form.phone.trim(),
      propertyId,
      unitTypeId,
      moveInDate: form.checkInDate || undefined,
      preferredDate: viewingDateTime(form.visitDate, form.visitTime),
      message: `${roomName} · ${visitDay}, ${form.visitTime} WIB`,
      pagePath: window.location.pathname,
      source: getLeadSource(),
    })
      .then(() =>
        track("submit_inquiry", { property: propertyName, room: roomName }),
      )
      .catch(() => {
        // Best-effort: the WhatsApp message is the primary channel.
      });
    setOpen(false);
    resetForm();
  };

  const triggerLabel = label ?? t("cta.sendInquiry");

  const triggerButton =
    variant === "icon" ? (
      <button
        type="button"
        disabled={disabled}
        aria-label={triggerLabel}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <Icon name="whatsapp" size={16} />
      </button>
    ) : variant === "compact" ? (
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60",
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
          "bg-brand font-semibold text-white hover:bg-brand-deep",
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
          <DialogTitle>{t("whatsapp.inquiryDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("whatsapp.inquiryDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="inquiry-name"
              className="mb-2 block text-sm font-semibold text-fg"
            >
              {t("whatsapp.inquiryDialog.name")}
              <RequiredMark className="ml-0.5" />
            </label>
            <input
              id="inquiry-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder={t("whatsapp.inquiryDialog.namePlaceholder")}
              className={cn(inputClassName, errors.name && inputErrorClassName)}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="inquiry-phone"
              className="mb-2 block text-sm font-semibold text-fg"
            >
              {t("whatsapp.inquiryDialog.phone")}
              <RequiredMark className="ml-0.5" />
            </label>
            <input
              id="inquiry-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder={t("whatsapp.inquiryDialog.phonePlaceholder")}
              className={cn(
                inputClassName,
                errors.phone && inputErrorClassName,
              )}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="inquiry-visit-date"
                className="mb-2 block text-sm font-semibold text-fg"
              >
                {t("whatsapp.inquiryDialog.visitDate")}
                <RequiredMark className="ml-0.5" />
              </label>
              <DatePicker
                id="inquiry-visit-date"
                value={form.visitDate}
                onChange={setField("visitDate")}
                fromDate={today}
                isDateDisabled={isViewingDayClosed}
                placeholder={t("whatsapp.inquiryDialog.visitDatePlaceholder")}
                popoverClassName="z-[60]"
                className={cn(
                  "h-12 rounded-xl border-line bg-white px-4 py-3 text-sm hover:border-line-strong focus:border-brand-hover/60 focus:bg-white focus:ring-brand-hover/15",
                  !form.visitDate && "text-fg-muted",
                  errors.visitDate && inputErrorClassName,
                )}
              />
              {errors.visitDate && (
                <p className="mt-1 text-xs text-red-500">{errors.visitDate}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="inquiry-visit-time"
                className="mb-2 block text-sm font-semibold text-fg"
              >
                {t("whatsapp.inquiryDialog.visitTime")}
                <RequiredMark className="ml-0.5" />
              </label>
              <SelectMenu
                id="inquiry-visit-time"
                aria-label={t("whatsapp.inquiryDialog.visitTime")}
                value={form.visitTime}
                onChange={setField("visitTime")}
                placeholder={t("whatsapp.inquiryDialog.visitTimePlaceholder")}
                options={timeOptions}
                className={cn("h-12", errors.visitTime && inputErrorClassName)}
              />
              {errors.visitTime && (
                <p className="mt-1 text-xs text-red-500">{errors.visitTime}</p>
              )}
            </div>
            <p className="-mt-2 text-xs text-fg-muted sm:col-span-2">
              {t("whatsapp.inquiryDialog.visitHint")}
            </p>
          </div>

          <div>
            <label
              htmlFor="inquiry-check-in"
              className="mb-2 block text-sm font-semibold text-fg"
            >
              {t("whatsapp.inquiryDialog.checkInDate")}
              <RequiredMark className="ml-0.5" />
            </label>
            <DatePicker
              id="inquiry-check-in"
              value={form.checkInDate}
              onChange={setField("checkInDate")}
              fromDate={today}
              placeholder={t("whatsapp.inquiryDialog.checkInDatePlaceholder")}
              popoverClassName="z-[60]"
              className={cn(
                "h-auto rounded-xl border-line bg-white px-4 py-3 text-sm hover:border-line-strong focus:border-brand-hover/60 focus:bg-white focus:ring-brand-hover/15",
                !form.checkInDate && "text-fg-muted",
                errors.checkInDate && inputErrorClassName,
              )}
            />
            {errors.checkInDate && (
              <p className="mt-1 text-xs text-red-500">{errors.checkInDate}</p>
            )}
          </div>

          {deposit ? (
            <div className="rounded-xl border border-hover bg-subtle px-4 py-3">
              <p className="text-sm text-fg-2">
                {t("whatsapp.inquiryDialog.depositNote", {
                  amount: formatCurrency(deposit),
                })}
              </p>
            </div>
          ) : null}

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              className="w-full bg-ink font-semibold text-white hover:bg-ink-2 sm:w-auto"
            >
              <Icon name="whatsapp" size={18} className="mr-2" />
              {t("whatsapp.inquiryDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

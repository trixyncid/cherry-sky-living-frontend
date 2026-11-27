/**
 * WhatsApp Inquiry Dialog
 * Asks only for name and WhatsApp number; a viewing slot, move-in date and a
 * question are optional. Opens WhatsApp with a pre-filled message and saves a
 * reservation lead so the owner sees it in the leads inbox even if the
 * visitor never presses send in WhatsApp.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { InquiryPerks } from "@/components/leads/InquiryPerks";
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
import { createLead, isValidIndonesianMobile } from "@/lib/api/public/leads";
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
  question: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  phone: "",
  visitDate: "",
  visitTime: "",
  checkInDate: "",
  question: "",
};

const timeOptions = VIEWING_TIMES.map((time) => ({
  value: time,
  label: `${time} WIB`,
}));

const inputClassName =
  "w-full rounded-lg border border-line-strong bg-white px-4 py-3 text-fg transition-colors placeholder:text-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

const pickerClassName =
  "h-12 rounded-lg border-line-strong bg-white px-4 py-3 text-sm hover:border-line-strong focus:border-brand focus:ring-brand/20";

const labelClassName = "mb-1.5 block text-sm font-semibold text-fg";

const errorClassName = "mt-1 text-xs text-red-500";

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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
    const tf = (key: string) => t(`whatsapp.inquiryDialog.${key}`);

    if (form.name.trim().length < 2) nextErrors.name = tf("required");
    if (!form.phone.trim()) nextErrors.phone = tf("required");
    else if (!isValidIndonesianMobile(form.phone))
      nextErrors.phone = tf("invalidPhone");
    // Viewing is optional, but a date and a time go together.
    if (form.visitDate) {
      const day = new Date(`${form.visitDate}T00:00:00`);
      if (Number.isNaN(day.getTime()) || day < today || isViewingDayClosed(day))
        nextErrors.visitDate = tf("invalidVisitDate");
      if (!form.visitTime) nextErrors.visitTime = tf("visitTimeNeeded");
    } else if (form.visitTime) {
      nextErrors.visitDate = tf("visitDateNeeded");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    const website = String(new FormData(e.currentTarget).get("website") ?? "");

    const tm = (key: string, values?: Record<string, string>) =>
      t(`whatsapp.inquiryDialog.message.${key}`, values);
    const visitDay = form.visitDate ? formatDate(form.visitDate, locale) : "";
    const question = form.question.trim();
    const message = [
      tm("intro", {
        name: form.name.trim(),
        roomType: roomName,
        propertyName,
      }),
      "",
      question || tm("defaultQuestion"),
      "",
      ...[
        visitDay ? tm("visit", { visitDay, visitTime: form.visitTime }) : null,
        form.checkInDate
          ? tm("moveIn", { date: formatDate(form.checkInDate, locale) })
          : null,
        tm("phone", { phone: form.phone.trim() }),
        deposit ? tm("deposit", { deposit: formatCurrency(deposit) }) : null,
      ].filter((line): line is string => Boolean(line)),
      "",
      tm("closing"),
    ].join("\n");

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
      preferredDate: visitDay
        ? viewingDateTime(form.visitDate, form.visitTime)
        : undefined,
      message: [
        visitDay
          ? `${roomName} · ${visitDay}, ${form.visitTime} WIB`
          : roomName,
        question,
      ]
        .filter(Boolean)
        .join("\n"),
      pagePath: window.location.pathname,
      source: getLeadSource(),
      website: website || undefined,
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="text-left">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            <Icon name="bed" size={14} />
            {roomName} · {propertyName}
          </p>
          <DialogTitle className="text-xl">
            {t("whatsapp.inquiryDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("whatsapp.inquiryDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <InquiryPerks className="-mt-1 border-b border-line pb-4" />

        <form onSubmit={handleSubmit} noValidate className="relative space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="inquiry-name" className={labelClassName}>
                {t("whatsapp.inquiryDialog.name")}
                <RequiredMark className="ml-0.5" />
              </label>
              <input
                id="inquiry-name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t("whatsapp.inquiryDialog.namePlaceholder")}
                aria-invalid={Boolean(errors.name)}
                className={cn(
                  inputClassName,
                  errors.name && inputErrorClassName,
                )}
              />
              {errors.name && <p className={errorClassName}>{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="inquiry-phone" className={labelClassName}>
                {t("whatsapp.inquiryDialog.phone")}
                <RequiredMark className="ml-0.5" />
              </label>
              <input
                id="inquiry-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder={t("whatsapp.inquiryDialog.phonePlaceholder")}
                aria-invalid={Boolean(errors.phone)}
                className={cn(
                  inputClassName,
                  errors.phone && inputErrorClassName,
                )}
              />
              {errors.phone && <p className={errorClassName}>{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="inquiry-question" className={labelClassName}>
              {t("whatsapp.inquiryDialog.question")}{" "}
              <span className="font-normal text-fg-muted">
                {t("whatsapp.inquiryDialog.optional")}
              </span>
            </label>
            <textarea
              id="inquiry-question"
              name="question"
              rows={3}
              maxLength={600}
              value={form.question}
              onChange={handleChange}
              placeholder={t("whatsapp.inquiryDialog.questionPlaceholder")}
              className={cn(inputClassName, "resize-none")}
            />
          </div>

          <fieldset className="rounded-xl border border-line bg-subtle/60 p-4">
            <legend className="px-1 text-sm font-semibold text-fg">
              {t("whatsapp.inquiryDialog.visitTitle")}{" "}
              <span className="font-normal text-fg-muted">
                {t("whatsapp.inquiryDialog.optional")}
              </span>
            </legend>
            <p className="mb-3 text-xs text-fg-muted">
              {t("whatsapp.inquiryDialog.visitHint")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inquiry-visit-date" className={labelClassName}>
                  {t("whatsapp.inquiryDialog.visitDate")}
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
                    pickerClassName,
                    !form.visitDate && "text-fg-muted",
                    errors.visitDate && inputErrorClassName,
                  )}
                />
                {errors.visitDate && (
                  <p className={errorClassName}>{errors.visitDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="inquiry-visit-time" className={labelClassName}>
                  {t("whatsapp.inquiryDialog.visitTime")}
                </label>
                <SelectMenu
                  id="inquiry-visit-time"
                  aria-label={t("whatsapp.inquiryDialog.visitTime")}
                  value={form.visitTime}
                  onChange={setField("visitTime")}
                  placeholder={t("whatsapp.inquiryDialog.visitTimePlaceholder")}
                  options={timeOptions}
                  className={cn(
                    "h-12 bg-white",
                    errors.visitTime && inputErrorClassName,
                  )}
                />
                {errors.visitTime && (
                  <p className={errorClassName}>{errors.visitTime}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inquiry-check-in" className={labelClassName}>
                  {t("whatsapp.inquiryDialog.checkInDate")}
                </label>
                <DatePicker
                  id="inquiry-check-in"
                  value={form.checkInDate}
                  onChange={setField("checkInDate")}
                  fromDate={today}
                  placeholder={t(
                    "whatsapp.inquiryDialog.checkInDatePlaceholder",
                  )}
                  popoverClassName="z-[60]"
                  className={cn(
                    pickerClassName,
                    !form.checkInDate && "text-fg-muted",
                  )}
                />
              </div>
            </div>
          </fieldset>

          {deposit ? (
            <p className="flex gap-2 text-xs text-fg-muted">
              <Icon name="info" size={16} className="shrink-0" />
              {t("whatsapp.inquiryDialog.depositNote", {
                amount: formatCurrency(deposit),
              })}
            </p>
          ) : null}

          <DialogFooter className="flex-col gap-2 pt-1 sm:flex-col">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-brand px-6 text-[15px] font-medium text-white hover:bg-brand-hover"
            >
              <Icon name="whatsapp" size={18} className="mr-2" />
              {t("whatsapp.inquiryDialog.submit")}
            </Button>
            <p className="text-center text-xs text-fg-muted">
              {t("whatsapp.inquiryDialog.submitNote")}
            </p>
          </DialogFooter>
          {/* Honeypot: hidden from people, bots fill it and the API drops the lead. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
          >
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Survey schedule dialog
 * Collects viewing details before redirecting to WhatsApp.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
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
import { listPublicProperties } from "@/lib/api/public/properties";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { parseDateOnly } from "@/lib/date-input";
import { publicKeys } from "@/lib/query/keys";
import { getLeadSource, track } from "@/lib/analytics";
import { createLead } from "@/lib/api/public/leads";
import { cn } from "@/lib/utils";
import { generateWhatsAppURL } from "@/lib/utils/format";

const SURVEY_TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

interface FormState {
  name: string;
  phone: string;
  surveyDate: string;
  surveyTime: string;
  propertyId: string;
  unitTypeId: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  surveyDate?: string;
  surveyTime?: string;
  propertyId?: string;
  unitTypeId?: string;
}

const inputClassName =
  "h-[3.25rem] w-full rounded-xl border border-[#cfc5c1] bg-white px-4 text-[#1a1c1a] transition-colors placeholder:text-[#6b6b6b] focus:border-[#8a1a12]/60 focus:outline-none focus:ring-2 focus:ring-[#8a1a12]/15";

const inputErrorClassName =
  "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/15";

const emptyForm: FormState = {
  name: "",
  phone: "",
  surveyDate: "",
  surveyTime: "",
  propertyId: "",
  unitTypeId: "",
};

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Surveys are Monday–Saturday only. */
function isSurveyDateDisabled(date: Date): boolean {
  return date.getDay() === 0;
}

interface SurveyScheduleDialogProps {
  triggerLabel: string;
  className?: string;
}

export function SurveyScheduleDialog({
  triggerLabel,
  className,
}: SurveyScheduleDialogProps) {
  const t = useTranslations("home.faq.surveyDialog");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const phoneNumber = useMemo(() => getContactWhatsAppNumber(), []);
  const today = useMemo(() => startOfToday(), []);

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: publicKeys.properties.all(),
    queryFn: listPublicProperties,
    enabled: open,
  });

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === form.propertyId),
    [properties, form.propertyId],
  );

  const propertyOptions = useMemo(
    () =>
      properties.map((property) => ({
        value: property.id,
        label: property.name,
      })),
    [properties],
  );

  const unitTypeOptions = useMemo(
    () =>
      (selectedProperty?.unitTypes ?? []).map((unitType) => ({
        value: unitType.id,
        label: unitType.name,
      })),
    [selectedProperty],
  );

  const timeOptions = useMemo(
    () =>
      SURVEY_TIMES.map((time) => ({
        value: time,
        label: time,
      })),
    [],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePropertyChange = (value: string) => {
    setForm((prev) => ({ ...prev, propertyId: value, unitTypeId: "" }));
    setErrors((prev) => ({
      ...prev,
      propertyId: undefined,
      unitTypeId: undefined,
    }));
  };

  const handleUnitTypeChange = (value: string) => {
    setForm((prev) => ({ ...prev, unitTypeId: value }));
    if (errors.unitTypeId) {
      setErrors((prev) => ({ ...prev, unitTypeId: undefined }));
    }
  };

  const handleSurveyDateChange = (value: string) => {
    setForm((prev) => ({ ...prev, surveyDate: value }));
    if (errors.surveyDate) {
      setErrors((prev) => ({ ...prev, surveyDate: undefined }));
    }
  };

  const handleSurveyTimeChange = (value: string) => {
    setForm((prev) => ({ ...prev, surveyTime: value }));
    if (errors.surveyTime) {
      setErrors((prev) => ({ ...prev, surveyTime: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = t("required");
    }
    if (!form.phone.trim()) {
      nextErrors.phone = t("required");
    } else if (!/^[\d\s+\-()]{8,}$/.test(form.phone.trim())) {
      nextErrors.phone = t("invalidPhone");
    }
    if (!form.propertyId) {
      nextErrors.propertyId = t("required");
    }
    if (!form.unitTypeId) {
      nextErrors.unitTypeId = t("required");
    }
    if (!form.surveyDate) {
      nextErrors.surveyDate = t("required");
    } else {
      const selected = parseDateOnly(form.surveyDate);
      if (!selected || isSurveyDateDisabled(selected) || selected < today) {
        nextErrors.surveyDate = t("invalidDate");
      }
    }
    if (!form.surveyTime) {
      nextErrors.surveyTime = t("required");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const propertyLabel = selectedProperty?.name ?? form.propertyId;
    const unitTypeLabel =
      unitTypeOptions.find((unitType) => unitType.value === form.unitTypeId)
        ?.label ?? form.unitTypeId;
    const selectedDate = parseDateOnly(form.surveyDate);
    const surveyDateLabel = selectedDate
      ? formatDate(selectedDate, locale)
      : form.surveyDate;

    const message = t("message", {
      name: form.name.trim(),
      phone: form.phone.trim(),
      surveyDay: surveyDateLabel,
      surveyTime: form.surveyTime,
      roomType: unitTypeLabel,
      property: propertyLabel,
    });

    // Open WhatsApp synchronously (popup blockers), then record the lead
    // in the background so the owner sees it in the leads inbox too.
    window.open(
      generateWhatsAppURL(phoneNumber, message),
      "_blank",
      "noopener,noreferrer",
    );
    const timeMatch = /^(\d{1,2}):(\d{2})/.exec(form.surveyTime);
    createLead({
      type: "viewing",
      name: form.name.trim(),
      phone: form.phone.trim(),
      propertyId: form.propertyId || undefined,
      unitTypeId: form.unitTypeId || undefined,
      preferredDate: timeMatch
        ? `${form.surveyDate}T${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}:00+07:00`
        : form.surveyDate || undefined,
      viewingMode: "in_person",
      pagePath: window.location.pathname,
      source: getLeadSource(),
    })
      .then(() => track("submit_viewing", { property: propertyLabel, room: unitTypeLabel }))
      .catch(() => {
        // WhatsApp already carries the request; saving is best-effort.
      });
    setOpen(false);
    resetForm();
  };

  const unitTypePlaceholder = !form.propertyId
    ? t("unitSelectPropertyFirst")
    : propertiesLoading
      ? t("unitsLoading")
      : unitTypeOptions.length === 0
        ? t("noUnitsAvailable")
        : t("unitPlaceholder");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1fb855]",
            className,
          )}
        >
          <Icon name="whatsapp" size={16} />
          {triggerLabel}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="survey-name"
              className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
            >
              {t("name")}
              <RequiredMark className="ml-0.5" />
            </label>
            <input
              id="survey-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder={t("namePlaceholder")}
              className={cn(inputClassName, errors.name && inputErrorClassName)}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="survey-phone"
              className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
            >
              {t("phone")}
              <RequiredMark className="ml-0.5" />
            </label>
            <input
              id="survey-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder={t("phonePlaceholder")}
              className={cn(
                inputClassName,
                errors.phone && inputErrorClassName,
              )}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="survey-property"
              className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
            >
              {t("property")}
              <RequiredMark className="ml-0.5" />
            </label>
            <SelectMenu
              id="survey-property"
              value={form.propertyId}
              onChange={handlePropertyChange}
              options={propertyOptions}
              disabled={propertiesLoading}
              placeholder={
                propertiesLoading
                  ? t("propertiesLoading")
                  : t("propertyPlaceholder")
              }
              className={cn(errors.propertyId && inputErrorClassName)}
              aria-label={t("property")}
            />
            {errors.propertyId && (
              <p className="mt-1 text-xs text-red-500">{errors.propertyId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="survey-unit-type"
              className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
            >
              {t("unit")}
              <RequiredMark className="ml-0.5" />
            </label>
            <SelectMenu
              id="survey-unit-type"
              value={form.unitTypeId}
              onChange={handleUnitTypeChange}
              options={unitTypeOptions}
              disabled={!form.propertyId || unitTypeOptions.length === 0}
              placeholder={unitTypePlaceholder}
              className={cn(errors.unitTypeId && inputErrorClassName)}
              aria-label={t("unit")}
            />
            {errors.unitTypeId && (
              <p className="mt-1 text-xs text-red-500">{errors.unitTypeId}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="survey-date"
                className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
              >
                {t("surveyDate")}
                <RequiredMark className="ml-0.5" />
              </label>
              <DatePicker
                id="survey-date"
                value={form.surveyDate}
                onChange={handleSurveyDateChange}
                fromDate={today}
                isDateDisabled={isSurveyDateDisabled}
                placeholder={t("surveyDatePlaceholder")}
                popoverClassName="z-[90]"
                className={cn(
                  "h-[3.25rem] min-h-[3.25rem] gap-2.5 rounded-xl border-[#e3e2e0] bg-white px-3 py-0 shadow-none hover:border-[#c4b0a4] hover:shadow-none focus:border-[#8a1a12]/60 focus:bg-white focus:ring-[#8a1a12]/15",
                  "[&>span:first-child]:size-6 [&>span:first-child]:rounded-lg [&>span:first-child]:bg-[#71130d]/10",
                  !form.surveyDate && "text-[#6b6b6b]",
                  errors.surveyDate && inputErrorClassName,
                )}
              />
              {errors.surveyDate && (
                <p className="mt-1 text-xs text-red-500">{errors.surveyDate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="survey-time"
                className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
              >
                {t("surveyTime")}
                <RequiredMark className="ml-0.5" />
              </label>
              <SelectMenu
                id="survey-time"
                value={form.surveyTime}
                onChange={handleSurveyTimeChange}
                options={timeOptions}
                placeholder={t("surveyTimePlaceholder")}
                className={cn(errors.surveyTime && inputErrorClassName)}
                aria-label={t("surveyTime")}
              />
              {errors.surveyTime && (
                <p className="mt-1 text-xs text-red-500">{errors.surveyTime}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              className="w-full bg-[#25D366] font-semibold text-white hover:bg-[#1fb855] sm:w-auto"
            >
              <Icon name="whatsapp" size={18} className="mr-2" />
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

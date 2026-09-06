/**
 * Survey schedule dialog
 * Collects viewing details before redirecting to WhatsApp.
 */

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import { Icon } from "@/components/shared/Icon";
import { RequiredMark } from "@/components/shared/required-mark";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { generateWhatsAppURL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const SURVEY_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

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

const PROPERTIES = ["skykost", "cherrykost"] as const;

interface FormState {
  name: string;
  phone: string;
  surveyDay: string;
  surveyTime: string;
  roomType: string;
  property: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  surveyDay?: string;
  surveyTime?: string;
  roomType?: string;
  property?: string;
}

const inputClassName =
  "w-full rounded-xl border border-[#e3e2e0] bg-white px-4 py-3 text-[#1a1c1a] transition-colors placeholder:text-[#b0a29a] focus:border-[#8b5e3c]/60 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/15";

const selectClassName =
  "w-full appearance-none rounded-xl border border-[#e3e2e0] bg-white py-3 pl-4 pr-10 text-[#1a1c1a] transition-colors focus:border-[#8b5e3c]/60 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/15";

const inputErrorClassName =
  "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/15";

const emptyForm: FormState = {
  name: "",
  phone: "",
  surveyDay: "",
  surveyTime: "",
  roomType: "",
  property: "",
};

interface SurveyScheduleDialogProps {
  triggerLabel: string;
  className?: string;
}

export function SurveyScheduleDialog({
  triggerLabel,
  className,
}: SurveyScheduleDialogProps) {
  const t = useTranslations("home.faq.surveyDialog");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const phoneNumber = useMemo(() => getContactWhatsAppNumber(), []);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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
    if (!form.surveyDay) {
      nextErrors.surveyDay = t("required");
    }
    if (!form.surveyTime) {
      nextErrors.surveyTime = t("required");
    }
    if (!form.roomType.trim()) {
      nextErrors.roomType = t("required");
    }
    if (!form.property) {
      nextErrors.property = t("required");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const propertyLabel =
      form.property === "cherrykost" ? t("cherrykost") : t("skykost");
    const dayLabel = t(`days.${form.surveyDay as (typeof SURVEY_DAYS)[number]}`);

    const message = t("message", {
      name: form.name.trim(),
      phone: form.phone.trim(),
      surveyDay: dayLabel,
      surveyTime: form.surveyTime,
      roomType: form.roomType.trim(),
      property: propertyLabel,
    });

    window.open(
      generateWhatsAppURL(phoneNumber, message),
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
    resetForm();
  };

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
              className={cn(inputClassName, errors.phone && inputErrorClassName)}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="survey-day"
                className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
              >
                {t("surveyDay")}
                <RequiredMark className="ml-0.5" />
              </label>
              <div className="relative">
                <select
                  id="survey-day"
                  name="surveyDay"
                  value={form.surveyDay}
                  onChange={handleChange}
                  className={cn(
                    selectClassName,
                    errors.surveyDay && inputErrorClassName,
                  )}
                >
                  <option value="">{t("surveyDayPlaceholder")}</option>
                  {SURVEY_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {t(`days.${day}`)}
                    </option>
                  ))}
                </select>
                <Icon
                  name="expand_more"
                  size={20}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#83746b]"
                />
              </div>
              {errors.surveyDay && (
                <p className="mt-1 text-xs text-red-500">{errors.surveyDay}</p>
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
              <div className="relative">
                <select
                  id="survey-time"
                  name="surveyTime"
                  value={form.surveyTime}
                  onChange={handleChange}
                  className={cn(
                    selectClassName,
                    errors.surveyTime && inputErrorClassName,
                  )}
                >
                  <option value="">{t("surveyTimePlaceholder")}</option>
                  {SURVEY_TIMES.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <Icon
                  name="expand_more"
                  size={20}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#83746b]"
                />
              </div>
              {errors.surveyTime && (
                <p className="mt-1 text-xs text-red-500">{errors.surveyTime}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="survey-room-type"
              className="mb-2 block text-sm font-semibold text-[#1a1c1a]"
            >
              {t("roomType")}
              <RequiredMark className="ml-0.5" />
            </label>
            <input
              id="survey-room-type"
              name="roomType"
              type="text"
              value={form.roomType}
              onChange={handleChange}
              placeholder={t("roomTypePlaceholder")}
              className={cn(
                inputClassName,
                errors.roomType && inputErrorClassName,
              )}
            />
            {errors.roomType && (
              <p className="mt-1 text-xs text-red-500">{errors.roomType}</p>
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
            <div className="relative">
              <select
                id="survey-property"
                name="property"
                value={form.property}
                onChange={handleChange}
                className={cn(
                  selectClassName,
                  errors.property && inputErrorClassName,
                )}
              >
                <option value="">{t("propertyPlaceholder")}</option>
                {PROPERTIES.map((property) => (
                  <option key={property} value={property}>
                    {t(property)}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                size={20}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#83746b]"
              />
            </div>
            {errors.property && (
              <p className="mt-1 text-xs text-red-500">{errors.property}</p>
            )}
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

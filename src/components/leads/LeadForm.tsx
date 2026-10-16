/**
 * Lead form (landing-page-instructions §7.1–7.2): inquiry or waitlist.
 * Two required fields; optional details collapsed. Honeypot + server rate
 * limit instead of a CAPTCHA. Success state offers WhatsApp immediately.
 */

"use client";

import { startOfToday } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { Icon } from "@/components/shared/Icon";
import { SelectMenu } from "@/components/shared/select-menu";
import { localized, siteConfig } from "@/config/site";
import { Link } from "@/i18n/routing";
import { getLeadSource, track } from "@/lib/analytics";
import { ApiError } from "@/lib/api/errors";
import { createLead, isValidIndonesianMobile } from "@/lib/api/public/leads";
import type { Kost } from "@/lib/types";
import { cn } from "@/lib/utils";
import { generateWhatsAppURL } from "@/lib/utils/format";

export interface LeadFormProps {
  type: "inquiry" | "waitlist";
  /** Context for a specific room (waitlist from a room card). */
  propertyId?: string;
  propertyName?: string;
  unitTypeId?: string;
  roomName?: string;
  /** Lets the visitor pick a residence when no context is given. */
  kosts?: Kost[];
  tone?: "light" | "dark";
  className?: string;
}

type Errors = Partial<Record<"name" | "phone" | "form", string>>;

export function LeadForm({
  type,
  propertyId,
  propertyName,
  unitTypeId,
  roomName,
  kosts = [],
  tone = "light",
  className,
}: LeadFormProps) {
  const t = useTranslations("leads");
  const tWhatsapp = useTranslations("whatsapp");
  const locale = useLocale();
  const uid = useId();
  const dark = tone === "dark";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(propertyId ?? "");
  const [moveIn, setMoveIn] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const whatsappUrl = generateWhatsAppURL(
    siteConfig.whatsappNumber,
    type === "waitlist" && roomName && propertyName
      ? tWhatsapp("waitlist", { roomType: roomName, propertyName })
      : tWhatsapp("generalInquiry"),
  );

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = t("errors.name");
    if (!isValidIndonesianMobile(phone)) next.phone = t("errors.phone");
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    try {
      await createLead({
        type,
        name: name.trim(),
        phone,
        propertyId: selectedProperty || undefined,
        unitTypeId,
        moveInDate: moveIn || undefined,
        budget: budget
          ? Number(budget.replace(/\D/g, "")) || undefined
          : undefined,
        message: message.trim() || undefined,
        pagePath: window.location.pathname,
        source: getLeadSource(),
        website,
      });
      track(type === "waitlist" ? "submit_waitlist" : "submit_inquiry", {
        property: propertyName ?? selectedProperty,
        room: roomName,
      });
      setStatus("done");
    } catch (error) {
      setStatus("idle");
      setErrors({
        form:
          error instanceof ApiError && error.status === 429
            ? t("errors.rateLimited")
            : t("errors.generic"),
      });
    }
  };

  const responseTime = localized(siteConfig.responseTime, locale);
  const hours = `${localized(siteConfig.viewingHours.days, locale)} ${siteConfig.viewingHours.time}`;

  const label = cn(
    "mb-1.5 block text-sm font-semibold",
    dark ? "text-white/85" : "text-[#1a1c1a]",
  );
  const input = cn(
    "h-12 w-full rounded-xl border px-4 text-base transition-colors focus:outline-none focus:ring-2",
    dark
      ? "border-white/15 bg-white/10 text-white placeholder:text-white/45 focus:border-white/40 focus:ring-white/20"
      : "border-[#cfc5c1] bg-white text-[#141414] placeholder:text-[#6b6b6b] focus:border-[#141414] focus:ring-[#141414]/10",
  );
  const errorText = cn(
    "mt-1.5 text-sm",
    dark ? "text-[#fca5a5]" : "text-[#ba1a1a]",
  );

  if (status === "done") {
    return (
      <output className={cn("flex flex-col items-start gap-4", className)}>
        <span className="flex size-12 items-center justify-center rounded-full bg-[#059669]/15 text-[#059669]">
          <Icon name="check" size={24} />
        </span>
        <p
          className={cn(
            "text-lg font-semibold",
            dark ? "text-white" : "text-[#1a1c1a]",
          )}
        >
          {t("success.title", { name: name.trim().split(" ")[0] })}
        </p>
        <p
          className={cn("text-base", dark ? "text-white/70" : "text-[#51443c]")}
        >
          {responseTime
            ? t("success.bodyWithTime", { time: responseTime })
            : t("success.body", { hours })}
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            track("click_whatsapp", { location: `lead_success_${type}` })
          }
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#1fb855]"
        >
          <Icon name="whatsapp" size={18} />
          {t("success.openWhatsApp")}
        </a>
      </output>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("flex flex-col gap-4", className)}
    >
      {/* Honeypot: hidden from people and assistive tech, tempting to bots */}
      <div
        aria-hidden
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor={`${uid}-website`}>Website</label>
        <input
          id={`${uid}-website`}
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className={label}>
            {t("name")}
          </label>
          <input
            id={`${uid}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() =>
              errors.name && setErrors((p) => ({ ...p, name: validate().name }))
            }
            placeholder={t("namePlaceholder")}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
            className={input}
          />
          {errors.name ? (
            <p id={`${uid}-name-error`} className={errorText}>
              {errors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={label}>
            {t("phone")}
          </label>
          <input
            id={`${uid}-phone`}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() =>
              errors.phone &&
              setErrors((p) => ({ ...p, phone: validate().phone }))
            }
            placeholder={t("phonePlaceholder")}
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${uid}-phone-error` : undefined}
            className={input}
          />
          {errors.phone ? (
            <p id={`${uid}-phone-error`} className={errorText}>
              {errors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        aria-expanded={showMore}
        className={cn(
          "inline-flex items-center gap-1.5 self-start text-sm font-semibold",
          dark ? "text-[#f4bb92]" : "text-[#71130d]",
        )}
      >
        <Icon name={showMore ? "remove" : "add"} size={16} />
        {t("moreDetails")}
      </button>

      {showMore ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {!unitTypeId && kosts.length > 0 ? (
            <div>
              <label htmlFor={`${uid}-property`} className={label}>
                {t("property")}
              </label>
              <SelectMenu
                id={`${uid}-property`}
                value={selectedProperty}
                onChange={setSelectedProperty}
                options={[
                  { value: "", label: t("anyProperty") },
                  ...kosts.map((k) => ({ value: k.id, label: k.name })),
                ]}
                className="h-12"
              />
            </div>
          ) : null}
          <div>
            <label htmlFor={`${uid}-movein`} className={label}>
              {t("moveIn")}
            </label>
            <DatePicker
              id={`${uid}-movein`}
              value={moveIn}
              onChange={setMoveIn}
              fromDate={startOfToday()}
              placeholder={t("moveInPlaceholder")}
              className="h-12"
            />
          </div>
          {type === "inquiry" ? (
            <div>
              <label htmlFor={`${uid}-budget`} className={label}>
                {t("budget")}
              </label>
              <input
                id={`${uid}-budget`}
                inputMode="numeric"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={t("budgetPlaceholder")}
                className={input}
              />
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-message`} className={label}>
              {t("message")}
            </label>
            <textarea
              id={`${uid}-message`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              rows={3}
              maxLength={1000}
              className={cn(input, "h-auto py-3")}
            />
          </div>
        </div>
      ) : null}

      {errors.form ? (
        <p role="alert" className={errorText}>
          {errors.form}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#71130d] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[#8a1a12] disabled:opacity-60"
      >
        {status === "sending" ? t("sending") : t(`submit.${type}`)}
      </button>

      <p className={cn("text-sm", dark ? "text-white/55" : "text-[#83746b]")}>
        {t("consent")}{" "}
        <Link
          href="/privacy"
          className={cn(
            "underline underline-offset-2",
            dark ? "hover:text-white" : "hover:text-[#71130d]",
          )}
        >
          {t("privacy")}
        </Link>
      </p>
    </form>
  );
}

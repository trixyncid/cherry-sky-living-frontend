/**
 * Message form (inquiry or waitlist). Two required fields; optional details
 * collapsed. Sending opens WhatsApp with a friendly message built from the
 * answers — nothing is stored on the server.
 */

"use client";

import { startOfToday } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { Icon } from "@/components/shared/Icon";
import { SelectMenu } from "@/components/shared/select-menu";
import { localized, siteConfig } from "@/config/site";
import { formatDate } from "@/features/admin/lib/format";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import { isValidIndonesianMobile } from "@/lib/api/public/leads";
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
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [sentUrl, setSentUrl] = useState("");

  /** The visitor's answers as a friendly WhatsApp message. */
  const buildMessage = () => {
    const propertyLabel =
      propertyName ?? kosts.find((k) => k.id === selectedProperty)?.name ?? "";
    const intro =
      message.trim() ||
      (type === "waitlist" && roomName && propertyLabel
        ? tWhatsapp("leadForm.waitlistDefault", {
            room: roomName,
            property: propertyLabel,
          })
        : tWhatsapp("leadForm.inquiryDefault"));
    const details = [
      roomName && type !== "waitlist"
        ? tWhatsapp("leadForm.room", { value: roomName })
        : null,
      propertyLabel && !(type === "waitlist" && !message.trim())
        ? tWhatsapp("leadForm.property", { value: propertyLabel })
        : null,
      moveIn
        ? tWhatsapp("leadForm.moveIn", { value: formatDate(moveIn, locale) })
        : null,
      budget ? tWhatsapp("leadForm.budget", { value: budget }) : null,
      tWhatsapp("leadForm.phone", { value: phone.trim() }),
    ].filter(Boolean);
    return [
      tWhatsapp("leadForm.greeting", { name: name.trim() }),
      "",
      intro,
      "",
      ...details,
      "",
      tWhatsapp("leadForm.closing"),
    ].join("\n");
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = t("errors.name");
    if (!isValidIndonesianMobile(phone)) next.phone = t("errors.phone");
    return next;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const url = generateWhatsAppURL(siteConfig.whatsappNumber, buildMessage());
    // Open synchronously from the click so pop-up blockers allow it.
    window.open(url, "_blank", "noopener,noreferrer");
    track(type === "waitlist" ? "submit_waitlist" : "submit_inquiry", {
      property: propertyName ?? selectedProperty,
      room: roomName,
    });
    setSentUrl(url);
    setStatus("done");
  };

  const responseTime = localized(siteConfig.responseTime, locale);
  const hours = `${localized(siteConfig.viewingHours.days, locale)} ${siteConfig.viewingHours.time}`;

  const label = cn(
    "mb-1.5 block text-sm font-semibold",
    dark ? "text-white/85" : "text-fg",
  );
  const input = cn(
    "h-12 w-full rounded-xl border px-4 text-base transition-colors focus:outline-none focus:ring-2",
    dark
      ? "border-white/15 bg-white/10 text-white placeholder:text-white/45 focus:border-white/40 focus:ring-white/20"
      : "border-line-strong bg-white text-fg placeholder:text-fg-muted focus:border-fg focus:ring-fg/10",
  );
  const errorText = cn(
    "mt-1.5 text-sm",
    dark ? "text-[#fca5a5]" : "text-danger",
  );

  if (status === "done") {
    return (
      <output className={cn("flex flex-col items-start gap-4", className)}>
        <span className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
          <Icon name="check" size={24} />
        </span>
        <p
          className={cn(
            "text-lg font-semibold",
            dark ? "text-white" : "text-fg",
          )}
        >
          {t("success.title", { name: name.trim().split(" ")[0] })}
        </p>
        <p className={cn("text-base", dark ? "text-white/70" : "text-fg-2")}>
          {responseTime
            ? t("success.bodyWithTime", { time: responseTime })
            : t("success.body", { hours })}
        </p>
        <a
          href={sentUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            track("click_whatsapp", { location: `lead_success_${type}` })
          }
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white transition-colors hover:bg-ink-2"
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
          dark ? "text-brand-bright" : "text-brand",
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
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-7 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        <Icon name="whatsapp" size={18} />
        {t(`submit.${type}`)}
      </button>

      <p className={cn("text-sm", dark ? "text-white/55" : "text-fg-muted")}>
        {t("consent")}{" "}
        <Link
          href="/privacy"
          className={cn(
            "underline underline-offset-2",
            dark ? "hover:text-white" : "hover:text-brand",
          )}
        >
          {t("privacy")}
        </Link>
      </p>
    </form>
  );
}

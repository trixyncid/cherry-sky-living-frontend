/**
 * Final call to action (§5.13): two ways to convert, side by side.
 * Sits on the navy footer: live availability, Book a viewing (saves a lead)
 * and WhatsApp; beside it the short inquiry form inline, so visitors who
 * prefer to be contacted can leave their number without opening a dialog.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { LeadForm } from "@/components/leads/LeadForm";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { localized, siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import type { Kost } from "@/lib/types";
import { generateWhatsAppURL } from "@/lib/utils/format";

export function FinalCtaCard({
  kosts = [],
  isLoading = false,
}: {
  kosts?: Kost[];
  isLoading?: boolean;
}) {
  const t = useTranslations("home.cta");
  const tLeads = useTranslations("leads.inquiry");
  const tWhatsapp = useTranslations("whatsapp");
  const locale = useLocale();
  const availableRooms = kosts.reduce((sum, k) => sum + k.availableRooms, 0);
  const whatsappUrl = generateWhatsAppURL(
    siteConfig.whatsappNumber,
    tWhatsapp("generalInquiry"),
  );

  return (
    <Reveal className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
      {/* Act now */}
      <div>
        <p className="eyebrow flex items-center gap-3 text-white/75">
          <span
            aria-hidden
            className={
              availableRooms > 0
                ? "size-2 rounded-full bg-success-bright"
                : "h-px w-10 bg-white/50"
            }
          />
          {t("eyebrow")}
        </p>
        <h2
          id="cta-heading"
          className="mt-6 max-w-2xl text-[clamp(2.1rem,4.4vw,3.75rem)] font-semibold leading-[1] tracking-[-0.04em]"
        >
          {isLoading ? (
            <span className="inline-block h-[0.9em] w-3/4 animate-pulse rounded-md bg-white/15 align-middle" />
          ) : (
            <span className="block text-balance">
              {t("liveTitle", { count: availableRooms })}
            </span>
          )}
          <span className="block text-balance font-normal text-white/55">
            {t("titleAccent")}
          </span>
        </h2>
        <p className="mt-7 max-w-md text-base leading-relaxed text-white/75 md:text-[17px]">
          {t("description")}
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <SurveyScheduleDialog
            triggerLabel={t("schedule")}
            className="mt-0 h-12 justify-center rounded-md bg-white px-6 py-0 text-[15px] font-medium text-ink hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          />
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("click_whatsapp", { location: "final_cta" })}
            className="btn btn-outline-light"
          >
            <Icon name="whatsapp" size={18} />
            {t("whatsapp")}
          </a>
        </div>
        <p className="mt-8 flex items-center gap-2 text-sm text-white/60">
          <Icon name="schedule" size={16} />
          {t("hoursLabel")}: {localized(siteConfig.viewingHours.days, locale)}{" "}
          {siteConfig.viewingHours.time}
        </p>
      </div>

      {/* Or be contacted */}
      <div className="rounded-md border border-white/15 p-6 sm:p-8">
        <p className="text-lg font-medium tracking-[-0.01em] text-white">
          {tLeads("title")}
        </p>
        <p className="mt-1 text-sm text-white/60">{tLeads("description")}</p>
        <LeadForm type="inquiry" tone="dark" kosts={kosts} className="mt-6" />
      </div>
    </Reveal>
  );
}

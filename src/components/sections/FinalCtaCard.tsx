/**
 * Final call to action (§5.13): two ways to convert, side by side.
 * Black panel — live availability, Book a viewing (saves a lead) and
 * WhatsApp. White panel — the short inquiry form inline, so visitors who
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
    <Reveal className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.7)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Act now */}
      <div className="relative overflow-hidden bg-ink-2 px-7 py-9 text-white ring-1 ring-inset ring-white/10 sm:px-10 sm:py-11">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-brand/40 blur-[90px]"
        />
        <div className="relative">
          <h2
            id="cta-heading"
            className="text-[clamp(1.75rem,2.6vw,2.35rem)] font-semibold leading-[1.08] tracking-[-0.03em]"
          >
            {isLoading ? (
              <span className="inline-block h-[0.9em] w-3/4 animate-pulse rounded-lg bg-white/15 align-middle" />
            ) : (
              t("liveTitle", { count: availableRooms })
            )}
            <span className="block text-brand-bright">{t("titleAccent")}</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            {t("description")}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <SurveyScheduleDialog
              triggerLabel={t("schedule")}
              className="mt-0 h-12 justify-center gap-2 rounded-full bg-brand px-6 text-[15px] hover:bg-brand-hover"
            />
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("click_whatsapp", { location: "final_cta" })}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              <Icon name="whatsapp" size={18} className="text-[#25d366]" />
              {t("whatsapp")}
            </a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-white/55">
            <Icon name="schedule" size={16} />
            {t("hoursLabel")}: {localized(siteConfig.viewingHours.days, locale)}{" "}
            {siteConfig.viewingHours.time}
          </p>
        </div>
      </div>

      {/* Or be contacted */}
      <div className="bg-white px-7 py-9 sm:px-10 sm:py-11">
        <p className="text-lg font-semibold tracking-tight text-fg">
          {tLeads("title")}
        </p>
        <p className="mt-1 text-sm text-fg-muted">{tLeads("description")}</p>
        <LeadForm type="inquiry" kosts={kosts} className="mt-5" />
      </div>
    </Reveal>
  );
}

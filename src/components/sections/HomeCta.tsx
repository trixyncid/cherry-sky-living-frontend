/**
 * Final conversion block (§5.13) — live availability headline, survey and
 * room CTAs, and a floating "Get in touch" card (inquiry form + contacts)
 * overlapping a full-bleed photo.
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CHECK_AVAILABILITY_HREF } from "@/components/layout/nav-links";
import { LeadForm } from "@/components/leads/LeadForm";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";
import { ArrowPill, Eyebrow } from "@/components/shared/ArrowPill";
import { Reveal } from "@/components/shared/Reveal";
import { localized, siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import type { Kost } from "@/lib/types";
import { generateWhatsAppURL } from "@/lib/utils/format";

const CTA_PHOTO = "/assets/skykost.jpeg";

interface HomeCtaProps {
  kosts?: Kost[];
  isLoading?: boolean;
}

export function HomeCta({ kosts = [], isLoading = false }: HomeCtaProps) {
  const t = useTranslations("home.cta");
  const tLeads = useTranslations("leads");
  const tWhatsapp = useTranslations("whatsapp");
  const locale = useLocale();

  const availableRooms = kosts.reduce((sum, k) => sum + k.availableRooms, 0);
  const whatsappUrl = generateWhatsAppURL(
    siteConfig.whatsappNumber,
    tWhatsapp("generalInquiry"),
  );

  const contacts = [
    {
      label: t("whatsappLabel"),
      value: siteConfig.whatsappNumber,
      href: whatsappUrl,
      onClick: () => track("click_whatsapp", { location: "final_cta_card" }),
    },
    {
      label: t("emailLabel"),
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
    },
    {
      label: t("hoursLabel"),
      value: `${localized(siteConfig.viewingHours.days, locale)} · ${siteConfig.viewingHours.time}`,
    },
  ];

  return (
    <section
      id="enquire"
      aria-labelledby="cta-heading"
      className="w-full scroll-mt-20 pt-16 lg:pt-24"
    >
      <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_27rem] lg:items-start lg:gap-12">
        <Reveal className="lg:pb-12">
          <Eyebrow>{t("reachOut")}</Eyebrow>
          <h2
            id="cta-heading"
            className="mt-4 max-w-2xl text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.08] tracking-[-0.035em] text-[#141414]"
          >
            {isLoading ? (
              <span className="inline-block h-[0.9em] w-3/4 animate-pulse rounded-lg bg-[#e7e4df] align-middle" />
            ) : (
              t("liveTitle", { count: availableRooms })
            )}{" "}
            <span className="text-[#857f77]">{t("titleAccent")}</span>
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#6b6b6b]">
            {t("description")}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ArrowPill href={CHECK_AVAILABILITY_HREF}>
              {t("seeRooms")}
            </ArrowPill>
            <SurveyScheduleDialog
              triggerLabel={t("schedule")}
              className="mt-0 h-12 justify-center rounded-full border border-[#dedad4] bg-transparent px-5 text-[15px] text-[#141414] hover:bg-white"
            />
          </div>
        </Reveal>

        <Reveal
          delay={0.1}
          className="relative z-10 overflow-hidden rounded-[1.25rem] bg-white shadow-[0_30px_70px_-30px_rgb(0_0_0/0.45)] lg:-mb-[24rem]"
        >
          <p className="bg-[#71130d] px-6 py-4 text-lg font-semibold text-white">
            {t("getInTouch")}
          </p>
          <div className="p-6">
            <p className="text-base text-[#6b6b6b]">
              {tLeads("inquiry.description")}
            </p>
            <LeadForm type="inquiry" kosts={kosts} className="relative mt-5" />
            <dl className="mt-6 grid gap-4 border-t border-[#efeeeb] pt-5">
              {contacts.map((c) => (
                <div key={c.label}>
                  <dt className="text-[13px] text-[#6b6b6b]">{c.label}</dt>
                  <dd className="mt-0.5 text-[17px] font-medium text-[#141414]">
                    {c.href ? (
                      <a
                        href={c.href}
                        target={
                          c.href.startsWith("http") ? "_blank" : undefined
                        }
                        rel="noopener noreferrer"
                        onClick={c.onClick}
                        className="hover:text-[#71130d]"
                      >
                        {c.value}
                      </a>
                    ) : (
                      c.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>

      <div className="relative mt-10 h-[20rem] w-full overflow-hidden sm:h-[24rem] lg:mt-0 lg:h-[30rem]">
        <Image
          src={CTA_PHOTO}
          alt=""
          fill
          sizes="100vw"
          className="object-cover grayscale"
        />
      </div>
    </section>
  );
}

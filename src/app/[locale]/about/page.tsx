/**
 * About Page - Cherry Sky Living
 */

"use client";

import { useTranslations } from "next-intl";
import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/layout/Footer";
import { AboutHero } from "@/components/sections/AboutHero";
import { AboutJourney } from "@/components/sections/AboutJourney";
import { AboutMission } from "@/components/sections/AboutMission";
import { AboutStats } from "@/components/sections/AboutStats";
import { AboutValues } from "@/components/sections/AboutValues";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { generateWhatsAppURL } from "@/lib/utils/format";
import { getContactWhatsAppNumber } from "@/lib/contact";

const CTA_PHOTO =
  "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1920&h=900&fit=crop&q=80";

export default function AboutPage() {
  const t = useTranslations("about");
  const tWhatsapp = useTranslations("whatsapp");
  const viewingUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    tWhatsapp("generalInquiry"),
  );

  return (
    <AppLayout>
      <AboutHero />
      <AboutMission />
      <AboutJourney />
      <AboutValues />
      <AboutStats />

      <section className="w-full bg-[#faf9f6] px-6 pb-20 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${CTA_PHOTO}")` }}
          />
          <div className="absolute inset-0 bg-maroon-deep/70" />
          <div className="relative z-10 flex flex-col items-start gap-5 px-8 py-16 md:px-14 md:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Cherry Sky Living
            </p>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-[#faf9f6] md:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-white/80">
              {t("cta.subtitle")}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href="/search-kosts"
                className="inline-flex items-center gap-2 rounded-full bg-[#6f4627] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#805533]"
              >
                {t("cta.button")}
                <Icon name="arrow_forward" size={16} />
              </Link>
              <a
                href={viewingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/15"
              >
                <Icon name="whatsapp" size={16} />
                {t("cta.viewing")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </AppLayout>
  );
}

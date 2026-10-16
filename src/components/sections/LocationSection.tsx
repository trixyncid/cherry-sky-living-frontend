/**
 * Location page — map, each residence's address with directions and a
 * visit request, plus viewing hours (landing-page-instructions §5.9).
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { localized, siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import type { Kost } from "@/lib/types";
import { generateWhatsAppURL } from "@/lib/utils/format";

const MEDAN_MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.3280502394305!2d98.6767!3d3.195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30313339d7c0a50d%3A0xf8e2a1b0!2sMedan%2C%20North%20Sumatra!5e0!3m2!1sen!2sid!4v1700000000000";

function mapsSearchUrl(kost: Kost) {
  const query = [kost.name, kost.location.address, kost.location.city]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

interface LocationSectionProps {
  kosts?: Kost[];
  isLoading?: boolean;
}

export function LocationSection({
  kosts = [],
  isLoading = false,
}: LocationSectionProps) {
  const t = useTranslations("location");
  const tWhatsapp = useTranslations("whatsapp");
  const locale = useLocale();

  return (
    <section
      aria-label={t("eyebrow")}
      className="w-full px-5 pb-14 pt-12 sm:px-8 lg:pb-20 lg:pt-16"
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 lg:gap-12">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_1fr]">
          <div className="flex flex-col gap-4">
            {isLoading
              ? [0, 1].map((i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="h-40 animate-pulse rounded-[1.5rem] bg-[#efeeeb]"
                  />
                ))
              : kosts.map((kost, index) => (
                  <Reveal
                    key={kost.id}
                    delay={index * 0.08}
                    className="rounded-[1.25rem] bg-white p-5"
                  >
                    <h2 className="text-lg font-semibold tracking-tight text-[#141414]">
                      {kost.name}
                    </h2>
                    <p className="mt-1.5 flex items-start gap-2 text-base leading-relaxed text-[#3d3a36]">
                      <Icon
                        name="location_on"
                        size={18}
                        className="mt-0.5 shrink-0 text-[#71130d]"
                      />
                      {[kost.location.address, kost.location.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={mapsSearchUrl(kost)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#71130d] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#8a1a12]"
                      >
                        <Icon name="near_me" size={16} />
                        {t("directions")}
                      </a>
                      <a
                        href={generateWhatsAppURL(
                          kost.whatsappNumber,
                          tWhatsapp("visitSchedule", {
                            propertyName: kost.name,
                          }),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          track("click_whatsapp", {
                            location: "location_page",
                            property: kost.name,
                          })
                        }
                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#dedad4] px-4 text-sm font-semibold text-[#141414] transition-colors hover:border-[#141414]"
                      >
                        <Icon
                          name="whatsapp"
                          size={16}
                          className="text-[#25D366]"
                        />
                        {t("requestVisit")}
                      </a>
                    </div>
                  </Reveal>
                ))}

            <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#71130d] p-5 text-white text-base">
              <Icon name="schedule" size={20} className="text-[#f3dedb]" />
              <span>
                <span className="font-semibold">{t("viewingHours")}:</span>{" "}
                {localized(siteConfig.viewingHours.days, locale)}{" "}
                {siteConfig.viewingHours.time}
              </span>
            </div>
          </div>

          <Reveal
            delay={0.1}
            className="relative min-h-[20rem] overflow-hidden rounded-[1.25rem] bg-[#e7e4df] lg:min-h-[28rem]"
          >
            <iframe
              src={MEDAN_MAP_EMBED_URL}
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t("mapTitle")}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

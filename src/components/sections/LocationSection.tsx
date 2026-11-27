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
      className="w-full bg-canvas px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[90rem]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
          <div className="flex flex-col gap-10">
            {isLoading
              ? [0, 1].map((i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="h-40 animate-pulse rounded-lg bg-hover"
                  />
                ))
              : kosts.map((kost, index) => (
                  <Reveal
                    key={kost.id}
                    delay={index * 0.08}
                    className="border-t border-line pt-6"
                  >
                    <p className="text-sm tabular-nums text-fg-faint">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-fg">
                      {kost.name}
                    </h2>
                    <p className="mt-2 flex items-start gap-2 text-base leading-relaxed text-fg-2">
                      <Icon
                        name="location_on"
                        size={18}
                        className="mt-0.5 shrink-0 text-fg-muted"
                      />
                      {[kost.location.address, kost.location.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={mapsSearchUrl(kost)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-solid"
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
                        className="btn btn-outline"
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

            <div className="border-t border-line pt-6">
              <p className="eyebrow flex items-center gap-3 text-fg-muted">
                <span aria-hidden className="size-2 rounded-full bg-success" />
                {t("viewingHours")}
              </p>
              <p className="mt-3 text-lg font-medium text-fg">
                {localized(siteConfig.viewingHours.days, locale)}{" "}
                {siteConfig.viewingHours.time}
              </p>
            </div>
          </div>

          <Reveal
            delay={0.1}
            className="relative min-h-[22rem] overflow-hidden rounded-lg border border-line bg-line lg:min-h-[36rem]"
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

/**
 * Homepage FAQ — sticky intro + contact card, numbered accordion.
 */

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";
import { Eyebrow } from "@/components/shared/ArrowPill";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { localized, siteConfig } from "@/config/site";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { generateWhatsAppURL } from "@/lib/utils/format";

/**
 * Order shown on the page. Items whose answer is empty in the locale files
 * are hidden, so the owner can fill policies in without touching code.
 */
const FAQ_IDS = [
  "visit",
  "deposit",
  "electricity",
  "wifi",
  "availability",
  "minimumStay",
  "payment",
  "parking",
  "guests",
  "curfew",
  "gender",
  "pets",
  "maintenance",
  "cancellation",
] as const;

interface HomeFaqProps {
  /** Main content of the /faq page (h1, room for the navbar). */
  asPage?: boolean;
}

export function HomeFaq({ asPage = false }: HomeFaqProps) {
  const t = useTranslations("home.faq");
  const tWhatsapp = useTranslations("whatsapp");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<(typeof FAQ_IDS)[number] | null>(
    "visit",
  );

  const answered = FAQ_IDS.filter((id) =>
    Boolean(String(t.raw(`items.${id}.a`) ?? "").trim()),
  );
  // schema.org FAQPage for search results (§11).
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answered.map((id) => ({
      "@type": "Question",
      name: t(`items.${id}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`items.${id}.a`) },
    })),
  };

  const whatsappUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    tWhatsapp("generalInquiry"),
  );

  return (
    <section
      id="faq"
      aria-labelledby={asPage ? undefined : "faq-heading"}
      aria-label={asPage ? t("title") : undefined}
      className={cn(
        "w-full py-24 lg:py-32",
        asPage ? "pt-16 lg:pt-20" : "bg-panel",
      )}
    >
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from our own copy
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto grid w-full max-w-[90rem] gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12">
        <Reveal className="flex flex-col justify-between gap-10 lg:sticky lg:top-28 lg:self-start">
          {asPage ? null : (
            <div>
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <h2
                id="faq-heading"
                className="mt-5 max-w-xl text-balance text-[clamp(2.1rem,4.4vw,3.75rem)] font-semibold leading-[1] tracking-[-0.04em] text-fg"
              >
                {t("title")}
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-fg-muted">
                {t("description")}
              </p>
            </div>
          )}

          {/* Contact card: who answers, when, and one clear way to reach
              them. WhatsApp is named by its glyph, in the site's own colours. */}
          <div className="max-w-md border-t border-line pt-6">
            <div className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg">
                <Icon name="whatsapp" size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-base font-medium text-fg">
                  {t("cardTitle")}
                </p>
                <p className="text-sm text-fg-muted">{t("cardSub")}</p>
              </div>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-fg-2">
              <Icon name="schedule" size={18} className="text-fg-muted" />
              {t("cardHours", {
                days: localized(siteConfig.viewingHours.days, locale),
                time: siteConfig.viewingHours.time,
              })}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("click_whatsapp", { location: "faq_card" })
                }
                className="btn btn-solid px-5"
              >
                <Icon name="whatsapp" size={18} />
                {t("cardChat")}
              </a>
              <Link href="/contact" className="btn btn-outline px-5">
                {t("cardForm")}
                <Icon name="north_east" size={17} />
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="border-t border-line">
            {answered.map((id, index) => {
              const isOpen = openId === id;
              const panelId = `faq-panel-${id}`;
              return (
                <li key={id} className="relative border-b border-line">
                  {/* Open row: a short cherry rule over the hairline. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -top-px left-0 h-px bg-brand transition-[width] duration-500 motion-reduce:transition-none",
                      isOpen ? "w-24" : "w-0",
                    )}
                  />
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : id)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="group flex w-full items-center gap-4 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand sm:gap-6"
                    >
                      <span
                        className={cn(
                          "w-6 shrink-0 text-sm tabular-nums transition-colors",
                          isOpen ? "text-brand" : "text-fg-faint",
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-[17px] font-medium tracking-[-0.01em] text-fg sm:text-xl">
                        {t(`items.${id}.q`)}
                      </span>
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 motion-reduce:transition-none",
                          isOpen
                            ? "rotate-45 border-brand text-brand"
                            : "border-line-strong text-fg group-hover:border-fg",
                        )}
                      >
                        <Icon name="add" size={18} />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        id={panelId}
                        initial={
                          reduceMotion ? false : { height: 0, opacity: 0 }
                        }
                        animate={{ height: "auto", opacity: 1 }}
                        exit={
                          reduceMotion ? undefined : { height: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="max-w-2xl pb-7 pl-10 pr-12 text-base leading-relaxed text-fg-2 sm:pl-12">
                          <p>{t(`items.${id}.a`)}</p>
                          {id === "visit" ? (
                            <SurveyScheduleDialog
                              triggerLabel={t("items.visit.cta")}
                              className="mt-5 h-11 rounded-md px-5 py-0 font-medium hover:bg-brand"
                            />
                          ) : null}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

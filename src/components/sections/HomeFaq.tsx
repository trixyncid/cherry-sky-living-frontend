/**
 * Homepage FAQ — sticky intro + contact card, numbered accordion.
 */

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";
import { ArrowPill, Eyebrow } from "@/components/shared/ArrowPill";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
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
  const tCta = useTranslations("home.cta");
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
        "w-full px-5 py-14 sm:px-8 lg:py-20",
        asPage ? "pt-12 lg:pt-16" : "bg-white",
      )}
    >
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from our own copy
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal className="flex flex-col justify-between gap-10 lg:sticky lg:top-28 lg:self-start">
          {asPage ? null : (
            <div>
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <h2
                id="faq-heading"
                className="mt-4 text-[clamp(2.2rem,4.4vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.04em] text-[#141414]"
              >
                {t("title")}
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[#6b6b6b]">
                {t("description")}
              </p>
            </div>
          )}

          <div className="flex max-w-md items-center gap-4 rounded-[1.25rem] bg-[#f7f3f2] p-3">
            <span className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-[#71130d] text-[#25D366]">
              <Icon name="whatsapp" size={40} />
            </span>
            <div className="min-w-0">
              <p className="text-[17px] font-semibold text-[#141414]">
                {t("cardTitle")}
              </p>
              <p className="text-sm text-[#6b6b6b]">{t("cardSub")}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ArrowPill
                  href={whatsappUrl}
                  external
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track("click_whatsapp", { location: "faq_card" })
                  }
                  className="h-10 text-sm"
                >
                  {tCta("whatsapp")}
                </ArrowPill>
                <Link
                  href="/contact"
                  className="px-2 text-sm font-semibold text-[#141414] underline-offset-4 hover:underline"
                >
                  {t("contactCta")}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="flex flex-col gap-3">
            {answered.map((id, index) => {
              const isOpen = openId === id;
              const panelId = `faq-panel-${id}`;
              return (
                <li
                  key={id}
                  className={cn(
                    "overflow-hidden rounded-xl border transition-colors duration-300",
                    isOpen
                      ? "border-[#dedad4] bg-[#f7f3f2]"
                      : "border-transparent bg-[#f7f3f2] hover:border-[#dedad4]",
                  )}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : id)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex w-full items-center gap-4 px-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#71130d] sm:px-6"
                    >
                      <span className="w-6 shrink-0 text-sm font-medium tabular-nums text-[#6b6b6b]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-[17px] font-semibold tracking-tight text-[#141414] sm:text-lg">
                        {t(`items.${id}.q`)}
                      </span>
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 motion-reduce:transition-none",
                          isOpen
                            ? "rotate-45 bg-[#71130d] text-white"
                            : "bg-[#e7e4df] text-[#141414]",
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
                        <div className="px-5 pb-6 pl-15 text-base leading-relaxed text-[#3d3a36] sm:px-6 sm:pl-[4rem]">
                          <p>{t(`items.${id}.a`)}</p>
                          {id === "visit" ? (
                            <SurveyScheduleDialog
                              triggerLabel={t("items.visit.cta")}
                              className="rounded-full"
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

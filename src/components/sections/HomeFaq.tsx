/**
 * Homepage FAQ accordion
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";

const FAQ_IDS = [
  "visit",
  "deposit",
  "electricity",
  "wifi",
  "availability",
] as const;

export function HomeFaq() {
  const t = useTranslations("home.faq");
  const [openId, setOpenId] = useState<(typeof FAQ_IDS)[number] | null>(
    "visit",
  );

  return (
    <section className="w-full bg-[#faf9f6] px-6 py-20 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
            {t("eyebrow")}
          </p>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-[#1a1c1a] md:text-4xl">
            {t("title")}
          </h2>
          <p className="mb-6 max-w-md text-sm leading-relaxed text-[#83746b]">
            {t("description")}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f4627] hover:text-[#805533]"
          >
            {t("contactCta")}
            <Icon name="arrow_forward" size={16} />
          </Link>
        </div>

        <div className="divide-y divide-[#e3e2e0]">
          {FAQ_IDS.map((id) => {
            const isOpen = openId === id;
            return (
              <div key={id}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : id)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-[#1a1c1a]">
                    {t(`items.${id}.q`)}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d5c3b8] bg-white text-[#6f4627]">
                    <Icon name={isOpen ? "remove" : "add"} size={18} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pb-5 text-sm leading-relaxed text-[#83746b]"
                    >
                      <p>{t(`items.${id}.a`)}</p>
                      {id === "visit" ? (
                        <SurveyScheduleDialog triggerLabel={t("items.visit.cta")} />
                      ) : null}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * How it works (§5.11) — black band with four numbered columns,
 * ending in a survey CTA.
 */

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { HomeSectionHeading } from "@/components/sections/HomeSectionHeading";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";
import { Icon } from "@/components/shared/Icon";
import { REVEAL_EASE } from "@/components/shared/Reveal";

const STEPS = [
  { icon: "search", key: "choose" },
  { icon: "event_available", key: "visit" },
  { icon: "contract", key: "lease" },
  { icon: "vpn_key", key: "movein" },
] as const;

export function HomeJourney() {
  const t = useTranslations("home.journey");
  const tCta = useTranslations("home.cta");
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="how-it-works"
      aria-labelledby="journey-heading"
      className="w-full bg-[#1c0b0a] px-5 py-14 text-white sm:px-8 lg:py-16"
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-10 lg:gap-12">
        <HomeSectionHeading
          id="journey-heading"
          tone="dark"
          eyebrow={t("eyebrow")}
          titleLead={t("titleLead")}
          titleAccent={t("titleAccent")}
          aside={
            <p className="text-base leading-relaxed text-white/60">
              {t("description")}
            </p>
          }
        />

        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => (
            <motion.li
              key={step.key}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                delay: index * 0.08,
                duration: 0.7,
                ease: REVEAL_EASE,
              }}
              className="flex flex-col"
            >
              <span className="border-b border-white/20 pb-3 text-sm font-semibold tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon
                name={step.icon}
                size={30}
                className="mt-5 text-white [font-variation-settings:'wght'_200]"
              />
              <p className="sr-only">{t("step", { n: index + 1 })}</p>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {t(`${step.key}.title`)}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-white/65">
                {t(`${step.key}.description`)}
              </p>
            </motion.li>
          ))}
        </ol>

        <div className="flex flex-col items-center gap-3 text-center">
          <SurveyScheduleDialog
            triggerLabel={tCta("schedule")}
            className="mt-0 h-12 rounded-full bg-white px-6 text-[15px] text-[#141414] hover:bg-[#f2f0ec]"
          />
          <p className="text-sm text-white/55">{t("hours")}</p>
        </div>
      </div>
    </section>
  );
}

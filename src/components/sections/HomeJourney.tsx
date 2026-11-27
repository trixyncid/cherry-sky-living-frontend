/**
 * How it works (§5.11) — navy band with four numbered columns,
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
      className="w-full bg-ink px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-14 lg:gap-20">
        <HomeSectionHeading
          id="journey-heading"
          tone="dark"
          eyebrow={t("eyebrow")}
          titleLead={t("titleLead")}
          titleAccent={t("titleAccent")}
          aside={
            <p className="text-base leading-relaxed text-white/65">
              {t("description")}
            </p>
          }
        />

        <ol className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
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
              <span className="border-t border-white/15 pt-5 text-sm tabular-nums text-white/45">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon
                name={step.icon}
                size={30}
                className="mt-8 text-white/80 [font-variation-settings:'wght'_200]"
              />
              <p className="sr-only">{t("step", { n: index + 1 })}</p>
              <h3 className="mt-6 text-xl font-semibold tracking-[-0.03em]">
                {t(`${step.key}.title`)}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-white/65">
                {t(`${step.key}.description`)}
              </p>
            </motion.li>
          ))}
        </ol>

        <div className="flex flex-col items-start gap-4 border-t border-white/15 pt-10 sm:flex-row sm:items-center sm:gap-8">
          <SurveyScheduleDialog
            triggerLabel={tCta("schedule")}
            className="mt-0 h-12 gap-3 rounded-xl bg-white px-6 text-[15px] font-medium text-ink hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
          <p className="eyebrow text-[10px] text-white/65">{t("hours")}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * About journey — viewing to move-in, three calm steps
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

const STEPS = [
  { icon: "calendar_month", key: "visit" as const },
  { icon: "handshake", key: "lease" as const },
  { icon: "home", key: "movein" as const },
];

export function AboutJourney() {
  const t = useTranslations("about.journey");

  return (
    <section className="w-full bg-[#faf9f6] px-6 py-20 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
            {t("eyebrow")}
          </p>
          <h2 className="mb-3 text-3xl font-semibold tracking-tight text-[#1a1c1a] md:text-4xl">
            {t("title")}
          </h2>
          <p className="text-sm leading-relaxed text-[#83746b] md:text-base">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="glass-card relative rounded-[1.75rem] p-7"
            >
              <span className="absolute right-6 top-6 text-4xl font-bold tabular-nums text-[#eee4db]">
                0{index + 1}
              </span>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6f4627] text-white">
                <Icon name={step.icon} size={24} />
              </div>
              <h3 className="mb-3 pr-10 text-lg font-semibold text-[#1a1c1a]">
                {t(`${step.key}.title`)}
              </h3>
              <p className="text-sm leading-relaxed text-[#83746b]">
                {t(`${step.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

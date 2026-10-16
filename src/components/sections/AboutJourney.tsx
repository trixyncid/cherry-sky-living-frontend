/**
 * About journey — viewing to move-in, three clear steps
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

const STEPS = [
  { icon: "chat", key: "visit" as const },
  { icon: "handshake", key: "lease" as const },
  { icon: "vpn_key", key: "movein" as const },
] as const;

export function AboutJourney() {
  const t = useTranslations("about.journey");

  return (
    <section className="relative w-full overflow-hidden bg-[#f3eee8] px-6 py-20 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_90%_0%,rgb(164_74_50/0.08),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-7xl">
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

        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <motion.li
              key={step.key}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.1, duration: 0.45 }}
              className="relative"
            >
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[2.25rem] top-6 hidden h-px w-[calc(100%-1rem)] bg-[#d5c3b8]/80 md:block"
                />
              ) : null}
              <div className="relative mb-5 flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#71130d] text-white">
                  <Icon name={step.icon} size={22} />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#83746b]">
                  {t("step", { n: index + 1 })}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-tight text-[#1a1c1a]">
                {t(`${step.key}.title`)}
              </h3>
              <p className="text-sm leading-relaxed text-[#83746b]">
                {t(`${step.key}.description`)}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

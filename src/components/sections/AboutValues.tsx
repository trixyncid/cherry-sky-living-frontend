/**
 * About values — standards for every residence
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

const VALUES = [
  {
    icon: "verified",
    titleKey: "quality.title",
    descKey: "quality.description",
  },
  {
    icon: "verified_user",
    titleKey: "trust.title",
    descKey: "trust.description",
  },
  {
    icon: "groups",
    titleKey: "community.title",
    descKey: "community.description",
  },
  {
    icon: "lightbulb",
    titleKey: "innovation.title",
    descKey: "innovation.description",
  },
] as const;

export function AboutValues() {
  const t = useTranslations("about.values");

  return (
    <section className="w-full bg-subtle px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted"
          >
            {t("subtitle")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-semibold tracking-tight text-fg md:text-4xl"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-3 text-sm leading-relaxed text-fg-muted md:text-base"
          >
            {t("description")}
          </motion.p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value, index) => (
            <motion.div
              key={value.titleKey}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="bg-subtle px-6 py-8 transition-colors hover:bg-white"
            >
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon name={value.icon} size={22} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-fg">
                {t(value.titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-fg-muted">
                {t(value.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

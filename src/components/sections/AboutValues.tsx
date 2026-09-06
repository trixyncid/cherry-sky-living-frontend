/**
 * About Values Section Component
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

export function AboutValues() {
  const t = useTranslations("about.values");

  const values = [
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
  ];

  return (
    <section className="w-full bg-[#faf9f6] px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]"
          >
            {t("subtitle")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-semibold tracking-tight text-[#1a1c1a] lg:text-4xl"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#83746b]"
          >
            {t("description")}
          </motion.p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <motion.div
              key={value.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="glass-card rounded-[1.5rem] p-6"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#6f4627] text-white">
                <Icon name={value.icon} size={24} />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-[#1a1c1a]">
                {t(value.titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-[#83746b]">
                {t(value.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * About Stats Section — light four-column bar
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { StatsBar } from "@/components/sections/StatsBar";

export function AboutStats() {
  const t = useTranslations("about.stats");

  return (
    <section className="relative w-full overflow-hidden bg-[#faf9f6] px-6 py-20 lg:px-10">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
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
            className="text-3xl font-semibold tracking-tight text-[#1a1c1a] md:text-4xl"
          >
            {t("title")}
          </motion.h2>
        </div>
        <StatsBar />
      </div>
    </section>
  );
}

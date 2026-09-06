/**
 * Terms Hero Section Component
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

export function TermsHero() {
  const t = useTranslations("terms.hero");

  return (
    <div className="relative flex min-h-[420px] w-full items-center justify-center overflow-hidden hero-atmosphere md:min-h-[500px]">
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 h-full w-full"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop")',
          }}
        />
        <div className="absolute inset-0 hero-overlay-x" />
        <div className="absolute inset-0 hero-overlay-y" />
      </motion.div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 px-6 text-center lg:px-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="glass-chip inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white"
        >
          <Icon name="policy" size={32} />
        </motion.div>
        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
        >
          {t("title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-light text-[#f5f2ee] md:text-xl"
        >
          {t("subtitle")}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl text-base font-light leading-relaxed text-[#f5f2ee]"
        >
          {t("description")}
        </motion.p>
      </div>
    </div>
  );
}

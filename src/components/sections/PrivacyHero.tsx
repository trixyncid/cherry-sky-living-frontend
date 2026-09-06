/**
 * Privacy Policy Hero Section
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

export function PrivacyHero() {
  const t = useTranslations("privacy.hero");

  return (
    <section className="relative flex min-h-[460px] w-full items-center justify-center overflow-hidden hero-atmosphere px-6 py-32 lg:px-10">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=1080&fit=crop")',
        }}
      />
      <div className="absolute inset-0 hero-overlay-x" />
      <div className="absolute inset-0 hero-overlay-y" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 inline-flex"
        >
          <div className="glass-chip rounded-2xl p-4">
            <Icon name="privacy_tip" size={40} className="text-white" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-6xl"
        >
          {t("title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-lg font-semibold text-[#f5e4d4] lg:text-2xl"
        >
          {t("subtitle")}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl text-base leading-relaxed text-[#f5f2ee] lg:text-lg"
        >
          {t("description")}
        </motion.p>
      </div>
    </section>
  );
}

/**
 * Home intro: split copy, architecture photos, and light stats bar
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { StatsBar } from "@/components/sections/StatsBar";

const INTRO_IMAGES = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&h=1100&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=700&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&h=700&fit=crop",
];

const STORY_POINTS = [
  { icon: "king_bed", key: "furnished" },
  { icon: "verified_user", key: "security" },
  { icon: "handshake", key: "support" },
] as const;

export function HomeIntro() {
  const t = useTranslations("home.intro");

  return (
    <section className="relative w-full overflow-hidden bg-[#faf9f6] px-6 py-20 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-14">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl text-3xl font-semibold tracking-tight text-[#1a1c1a] md:text-5xl"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-md text-sm leading-relaxed text-[#83746b] md:text-base"
          >
            {t("description")}
          </motion.p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative col-span-1 row-span-2 min-h-[280px] overflow-hidden rounded-[1.75rem] md:min-h-[420px]"
          >
            <Image src={INTRO_IMAGES[0]} alt="" fill className="object-cover" />
          </motion.div>
          {INTRO_IMAGES.slice(1).map((src, index) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * (index + 1) }}
              className="relative h-48 overflow-hidden rounded-[1.75rem] md:h-52"
            >
              <Image src={src} alt="" fill className="object-cover" />
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="col-span-2 flex flex-col justify-center rounded-[1.75rem] border border-[#e3e2e0] bg-white/80 px-6 py-6 md:min-h-[12.5rem] lg:px-8 lg:py-7"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
              {t("storyEyebrow")}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#51443c] md:text-[15px]">
              {t("story")}
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {STORY_POINTS.map((point) => (
                <li
                  key={point.key}
                  className="flex items-start gap-2 text-sm leading-snug text-[#1a1c1a]"
                >
                  <Icon
                    name={point.icon}
                    size={18}
                    className="mt-0.5 shrink-0 text-[#6f4627]"
                  />
                  <span>{t(`points.${point.key}`)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <StatsBar />
      </div>
    </section>
  );
}

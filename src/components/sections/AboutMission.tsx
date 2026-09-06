/**
 * About mission — story + photo, then mission and vision cards
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

const STORY_PHOTO =
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=1400&fit=crop&q=80";

export function AboutMission() {
  const t = useTranslations("about.mission");

  return (
    <section className="w-full bg-[#faf9f6] px-6 py-20 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
              {t("eyebrow")}
            </p>
            <h2 className="mb-4 max-w-md text-3xl font-semibold tracking-tight text-[#1a1c1a] md:text-4xl">
              {t("storyTitle")}
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-[#83746b] md:text-base">
              {t("storyDescription")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative min-h-[320px] overflow-hidden rounded-[1.75rem] md:min-h-[420px]"
          >
            <Image
              src={STORY_PHOTO}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-[1.75rem] p-8"
          >
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6f4627] text-white">
              <Icon name="flag" size={24} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f4627]">
              {t("subtitle")}
            </p>
            <h3 className="mb-4 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
              {t("title")}
            </h3>
            <p className="text-sm leading-relaxed text-[#51443c] md:text-base">
              {t("description")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="glass-card rounded-[1.75rem] p-8"
          >
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4af37] text-white">
              <Icon name="visibility" size={24} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b8941f]">
              {t("subtitle")}
            </p>
            <h3 className="mb-4 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
              {t("vision")}
            </h3>
            <p className="text-sm leading-relaxed text-[#51443c] md:text-base">
              {t("visionDescription")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * Hero — cinematic photo, story, featured stay, and primary CTAs
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { useKosts } from "@/lib/hooks/use-kost-data";
import type { Kost } from "@/lib/types";
import { formatCurrency, generateWhatsAppURL } from "@/lib/utils/format";
import { getContactWhatsAppNumber } from "@/lib/contact";

const HERO_PHOTO = "/assets/cherry-kost.jpeg";

export function Hero() {
  const t = useTranslations();
  const { data: kosts } = useKosts();
  const featured = kosts?.find((kost) => kost.isFeatured) ?? kosts?.[0];
  const availableRooms = (kosts ?? []).reduce(
    (sum, kost) => sum + kost.availableRooms,
    0,
  );
  const fromPrice = Math.min(
    ...(kosts ?? [])
      .map((kost) => kost.priceRange.min)
      .filter((price) => price > 0),
  );
  const hasFromPrice = Number.isFinite(fromPrice);

  const viewingUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    t("whatsapp.generalInquiry"),
  );

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col hero-atmosphere pt-[max(5rem,calc(4rem+env(safe-area-inset-top)))] lg:h-[min(90svh,58rem)] lg:min-h-[44rem]">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={HERO_PHOTO}
            alt={t("hero.title")}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 hero-overlay-x" />
        <div className="absolute inset-0 hero-overlay-y" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-8 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-14">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4af37]" />
              {t("hero.eyebrow")}
            </motion.p>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.1,
                duration: 0.55,
                type: "spring",
                stiffness: 70,
              }}
              className="text-[2.15rem] font-bold leading-[1.1] tracking-tight text-[#faf9f6] sm:text-5xl lg:text-[3.4rem]"
            >
              {t("hero.title")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.45 }}
              className="mt-4 max-w-lg text-sm font-light leading-relaxed text-[#f5f2ee]/90 md:text-base"
            >
              {t("hero.subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.45 }}
              className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/85 sm:text-sm"
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="groups" size={16} className="text-[#d4af37]" />
                {t("hero.trustResidents")}
              </span>
              <span className="h-3 w-px bg-white/25" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <Icon
                  name="verified_user"
                  size={16}
                  className="text-[#d4af37]"
                />
                {t("hero.trustSecurity")}
              </span>
              {hasFromPrice ? (
                <>
                  <span className="h-3 w-px bg-white/25" aria-hidden />
                  <span className="inline-flex items-center gap-1.5">
                    <Icon
                      name="payments"
                      size={16}
                      className="text-[#d4af37]"
                    />
                    {t("hero.fromPrice", {
                      price: formatCurrency(fromPrice, { compact: true }),
                    })}
                  </span>
                </>
              ) : null}
              {availableRooms > 0 ? (
                <>
                  <span className="h-3 w-px bg-white/25" aria-hidden />
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                    {t("hero.roomsOpen", { count: availableRooms })}
                  </span>
                </>
              ) : null}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46, duration: 0.45 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <a
                href={viewingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#6f4627] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgb(111_70_39_/_0.35)] hover:bg-[#805533]"
              >
                <Icon name="whatsapp" size={16} />
                {t("hero.trustViewing")}
              </a>
              <a
                href="#properties"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/15"
              >
                {t("hero.cta")}
                <Icon name="arrow_forward" size={16} />
              </a>
            </motion.div>
          </div>

          {featured ? <FeaturedStayCard kost={featured} /> : null}
        </div>
      </div>
    </section>
  );
}

function FeaturedStayCard({ kost }: { kost: Kost }) {
  const t = useTranslations();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="hidden lg:block"
    >
      <Link
        href={`/kosts/${kost.id}`}
        className="glass-card group block overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgb(61_24_32_/_0.35)] ring-1 ring-ferrugem/30"
      >
        <div className="relative h-52 overflow-hidden bg-[#f5e4d4]">
          {kost.thumbnail ? (
            <Image
              src={kost.thumbnail}
              alt={kost.name}
              fill
              sizes="360px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/55 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-maroon-deep px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-ferrugem/50">
            {t("hero.featuredLabel")}
          </span>
          {kost.availableRooms > 0 ? (
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-maroon-deep/75 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
              {t("hero.roomsOpen", { count: kost.availableRooms })}
            </span>
          ) : null}
        </div>
        <div className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#83746b]">
            {kost.location.district || kost.location.city}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#1a1c1a] group-hover:text-[#6f4627]">
            {kost.name}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#83746b]">
            {kost.location.address}
          </p>
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#eee4db] pt-4">
            <div>
              {kost.priceRange.min > 0 ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#83746b]">
                    {t("pricing.startingFrom")}
                  </p>
                  <p className="text-lg font-bold text-[#1a1c1a]">
                    {formatCurrency(kost.priceRange.min, { compact: true })}
                    <span className="text-xs font-normal text-[#83746b]">
                      {t("pricing.perMonth")}
                    </span>
                  </p>
                </>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#6f4627]">
              {t("hero.viewProperty")}
              <Icon name="arrow_forward" size={16} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

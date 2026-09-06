/**
 * Search hero — compact cinematic intro with overlapping search dock
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { HeroSearchBar } from "@/components/sections/HeroSearchBar";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { useKosts } from "@/lib/hooks/use-kost-data";
import type { Kost, SearchFilters } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

const SEARCH_PHOTO =
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&h=1080&fit=crop&q=80";

interface SearchHeroProps {
  initialFilters?: SearchFilters;
  onSearchSubmit?: (filters: SearchFilters) => void;
}

export function SearchHero({
  initialFilters,
  onSearchSubmit,
}: SearchHeroProps) {
  const t = useTranslations("search");
  const tHero = useTranslations("hero");
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

  return (
    <section className="relative flex min-h-[min(48svh,26rem)] w-full flex-col hero-atmosphere pt-[max(5rem,calc(4rem+env(safe-area-inset-top)))] lg:min-h-[min(46svh,28rem)]">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={SEARCH_PHOTO}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%]"
          />
        </motion.div>
        <div className="absolute inset-0 hero-overlay-x" />
        <div className="absolute inset-0 hero-overlay-y" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-8 lg:px-10">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4af37]" />
              {t("eyebrow")}
            </motion.p>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.1,
                duration: 0.5,
                type: "spring",
                stiffness: 70,
              }}
              className="max-w-2xl text-[2rem] font-bold leading-[1.12] tracking-tight text-[#faf9f6] sm:text-4xl lg:text-5xl"
            >
              {t("title")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.4 }}
              className="mt-3 max-w-lg text-sm font-light leading-relaxed text-[#f5f2ee]/90 md:text-base"
            >
              {t("subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.4 }}
              className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/85 sm:text-sm"
            >
              {availableRooms > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                  {tHero("roomsOpen", { count: availableRooms })}
                </span>
              ) : null}
              {hasFromPrice ? (
                <>
                  <span className="h-3 w-px bg-white/25" aria-hidden />
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="payments" size={16} className="text-[#d4af37]" />
                    {tHero("fromPrice", {
                      price: formatCurrency(fromPrice, { compact: true }),
                    })}
                  </span>
                </>
              ) : null}
            </motion.div>
          </div>

          {featured ? <SearchHeroPhoto kost={featured} /> : null}
        </div>
      </div>

      <HeroSearchBar
        initialFilters={initialFilters}
        onSubmit={onSearchSubmit}
        showQuickFilters={false}
      />
    </section>
  );
}

function SearchHeroPhoto({ kost }: { kost: Kost }) {
  const t = useTranslations("hero");
  const photo = kost.thumbnail || kost.images[0];

  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.32, duration: 0.5 }}
      className="hidden lg:block"
    >
      <Link
        href={`/kosts/${kost.id}`}
        className="group relative block overflow-hidden rounded-[1.5rem] ring-1 ring-ferrugem/45 shadow-[0_20px_48px_rgb(61_24_32_/_0.4)]"
      >
        <div className="relative aspect-[4/3] w-full bg-[#f5e4d4]">
          <Image
            src={photo}
            alt={kost.name}
            fill
            sizes="300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/70 via-maroon-deep/10 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
            {t("featuredLabel")}
          </p>
          <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-white">
            {kost.name}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * Neighborhood — map + featured residence with visit CTAs
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import type { Kost } from "@/lib/types";
import { formatCurrency, generateWhatsAppURL } from "@/lib/utils/format";

const MEDAN_MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.3280502394305!2d98.6767!3d3.195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30313339d7c0a50d%3A0xf8e2a1b0!2sMedan%2C%20North%20Sumatra!5e0!3m2!1sen!2sid!4v1700000000000";

interface HomeNeighborhoodProps {
  featured?: Kost;
}

export function HomeNeighborhood({ featured }: HomeNeighborhoodProps) {
  const t = useTranslations("home.neighborhood");
  const tCta = useTranslations("cta");
  const tPricing = useTranslations("pricing");
  const tWhatsapp = useTranslations("whatsapp");

  const visitUrl = featured
    ? generateWhatsAppURL(
        featured.whatsappNumber,
        tWhatsapp("visitSchedule", { propertyName: featured.name }),
      )
    : undefined;

  return (
    <section className="w-full bg-subtle px-6 py-20 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl items-start gap-12 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
            {t("eyebrow")}
          </p>
          <h2 className="mb-4 max-w-md text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            {t("title")}
          </h2>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-fg-muted md:text-base">
            {t("description")}
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-[1.5rem] border border-line"
          >
            <iframe
              src={MEDAN_MAP_EMBED_URL}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Cherry Sky Living Locations"
            />
          </motion.div>
        </div>

        {featured ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-brand-soft sm:aspect-[5/6]">
              {featured.thumbnail ? (
                <Image
                  src={featured.thumbnail}
                  alt={featured.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/45 to-transparent p-6 pt-24 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  {featured.location.district || featured.location.city}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">
                  {featured.name}
                </h3>
                <p className="mt-2 flex items-start gap-1.5 text-sm text-white/80">
                  <Icon
                    name="location_on"
                    size={16}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="line-clamp-2">
                    {featured.location.address}
                    {featured.location.city
                      ? `, ${featured.location.city}`
                      : ""}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
              <div className="flex flex-wrap gap-4 text-sm text-fg-2">
                <span className="inline-flex items-center gap-1.5">
                  <Icon
                    name="meeting_room"
                    size={16}
                    className="text-brand"
                  />
                  {t("roomsAvailable", {
                    available: featured.availableRooms,
                    total: featured.totalRooms,
                  })}
                </span>
                {featured.priceRange.min > 0 ? (
                  <span className="font-semibold text-fg">
                    {formatCurrency(featured.priceRange.min)}
                    <span className="ml-0.5 font-medium text-fg-muted">
                      {tPricing("perMonth")}
                    </span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/kosts/${featured.id}`}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-line-strong bg-white px-4 text-sm font-semibold text-fg transition-colors hover:bg-subtle sm:flex-none"
              >
                {tCta("viewDetails")}
              </Link>
              {visitUrl ? (
                <a
                  href={visitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover sm:flex-none"
                >
                  <Icon name="whatsapp" size={16} />
                  {t("requestVisit")}
                </a>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

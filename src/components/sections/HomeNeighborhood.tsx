/**
 * Neighborhood map with overlapping featured-property glass card
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
    <section className="w-full bg-[#faf9f6] px-6 py-20 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
            {t("eyebrow")}
          </p>
          <h2 className="mb-4 max-w-md text-3xl font-semibold tracking-tight text-[#1a1c1a] md:text-4xl">
            {t("title")}
          </h2>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-[#83746b]">
            {t("description")}
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[1.75rem] border border-[#e3e2e0]"
          >
            <iframe
              src={MEDAN_MAP_EMBED_URL}
              width="100%"
              height="420"
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
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="overflow-hidden rounded-[1.75rem] ring-1 ring-ferrugem/35">
              <div className="relative aspect-[4/5] w-full bg-[#f5e4d4]">
                {featured.thumbnail ? (
                  <Image
                    src={featured.thumbnail}
                    alt={featured.name}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
            </div>

            <div className="glass-card absolute right-6 bottom-6 left-6 rounded-2xl p-5 md:left-auto md:w-[320px]">
              <h3 className="text-lg font-semibold text-[#1a1c1a]">
                {featured.name}
              </h3>
              <p className="mt-1 flex items-start gap-1 text-xs text-[#83746b]">
                <Icon
                  name="location_on"
                  size={14}
                  className="mt-0.5 shrink-0"
                />
                <span className="line-clamp-2">
                  {featured.location.address}
                  {featured.location.city ? `, ${featured.location.city}` : ""}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#51443c]">
                <span className="inline-flex items-center gap-1">
                  <Icon name="meeting_room" size={14} />
                  {featured.availableRooms}/{featured.totalRooms}
                </span>
                {featured.priceRange.min > 0 && (
                  <span className="font-semibold text-[#1a1c1a]">
                    {formatCurrency(featured.priceRange.min)}
                    <span className="ml-0.5 font-medium text-[#83746b]">
                      {tPricing("perMonth")}
                    </span>
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  href={`/kosts/${featured.id}`}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-[#d5c3b8] bg-white/70 text-xs font-semibold text-[#1a1c1a]"
                >
                  {tCta("viewDetails")}
                </Link>
                {visitUrl ? (
                  <a
                    href={visitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-[#6f4627] px-3 text-xs font-semibold text-white"
                  >
                    {t("requestVisit")}
                  </a>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

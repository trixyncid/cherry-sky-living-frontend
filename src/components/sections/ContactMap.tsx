/**
 * Contact map — locations beside embed, viewing CTA
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { generateWhatsAppURL } from "@/lib/utils/format";

interface MapLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
}

const MEDAN_MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.3280502394305!2d98.6767!3d3.195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30313339d7c0a50d%3A0xf8e2a1b0!2sMedan%2C%20North%20Sumatra!5e0!3m2!1sen!2sid!4v1700000000000";

export function ContactMap() {
  const t = useTranslations("contact.map");
  const tWhatsapp = useTranslations("whatsapp");
  const visitUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    tWhatsapp("generalInquiry"),
  );

  const locations: MapLocation[] = [
    {
      id: "skykost",
      name: "SKYKOST",
      address: "Jl. Gaharu Gg. Amat Lama No. 12, Medan Area, Medan",
      phone: "+62 811-6359-119",
    },
    {
      id: "cherry-kost",
      name: "CHERRY KOST",
      address: "Jl. Setia Budi No. 45, Medan Maimun, Medan",
      phone: "+62 811-6359-119",
    },
  ];

  return (
    <section
      id="locations"
      className="w-full scroll-mt-24 bg-[#f3eee8] px-6 py-20 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
            {t("subtitle")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[#1a1c1a] md:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="h-96 overflow-hidden rounded-[1.5rem] border border-[#e3e2e0] lg:col-span-2"
          >
            <iframe
              src={MEDAN_MAP_EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Cherry Sky Living Locations"
            />
          </motion.div>

          <div className="flex flex-col gap-4">
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-[1.5rem] border border-[#e3e2e0] bg-[#faf9f6] p-6"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-[#1a1c1a]">
                    {location.name}
                  </h3>
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#71130d] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                <p className="mb-3 flex items-start gap-2 text-sm leading-relaxed text-[#83746b]">
                  <Icon
                    name="location_on"
                    size={16}
                    className="mt-0.5 shrink-0 text-[#71130d]"
                  />
                  {location.address}
                </p>
                <a
                  href={`tel:${location.phone}`}
                  className="mb-4 inline-flex items-center gap-2 text-sm text-[#83746b] transition-colors hover:text-[#71130d]"
                >
                  <Icon name="call" size={16} className="text-[#71130d]" />
                  {location.phone}
                </a>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(location.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#71130d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8a1a12]"
                >
                  <Icon name="directions" size={16} />
                  {t("directionsButton")}
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mt-12 overflow-hidden rounded-[1.5rem] bg-maroon-deep px-8 py-10 text-[#faf9f6] md:px-10"
        >
          <div className="pointer-events-none absolute inset-0">
            <Image
              src="/assets/cherry-kost.jpeg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-maroon-deep via-maroon-deep/90 to-maroon-deep/75" />
          </div>
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="mb-2 text-xl font-semibold tracking-tight md:text-2xl">
                {t("visitTitle")}
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-white/75">
                {t("visitDescription")}
              </p>
            </div>
            <a
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#3d1820] transition-colors hover:bg-[#f5f2ee]"
            >
              <Icon name="whatsapp" size={16} />
              {t("visitCta")}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

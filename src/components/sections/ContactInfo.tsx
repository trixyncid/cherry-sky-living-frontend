/**
 * Contact info — compact stack for the form sidebar
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

interface ContactDetail {
  id: string;
  icon: string;
  title: string;
  items: string[];
  href?: string;
}

export function ContactInfo() {
  const t = useTranslations("contact.info");

  const contactDetails: ContactDetail[] = [
    {
      id: "address",
      icon: "location_on",
      title: t("address"),
      items: [t("addressSkykost"), t("addressCherry")],
      href: "#locations",
    },
    {
      id: "phone",
      icon: "call",
      title: t("phone"),
      items: [t("phonePrimary")],
      href: "tel:+628116359119",
    },
    {
      id: "email",
      icon: "mail",
      title: t("email"),
      items: [t("emailPrimary")],
      href: "mailto:info@cherryskykost.com",
    },
    {
      id: "hours",
      icon: "schedule",
      title: t("hours"),
      items: [t("weekdaysHours"), t("saturdayHours"), t("weekendClosed")],
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
          {t("subtitle")}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-[#1a1c1a] md:text-3xl">
          {t("title")}
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {contactDetails.map((detail, index) => {
          const content = (
            <>
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5e4d4] text-[#6f4627]">
                <Icon name={detail.icon} size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="mb-1 text-sm font-semibold text-[#1a1c1a]">
                  {detail.title}
                </h3>
                <div className="space-y-1">
                  {detail.items.map((line) => (
                    <p
                      key={line}
                      className="text-sm leading-relaxed text-[#83746b]"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </>
          );

          return (
            <motion.div
              key={detail.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
            >
              {detail.href ? (
                <a
                  href={detail.href}
                  className="glass-card flex gap-4 rounded-[1.5rem] p-5 transition-colors hover:border-[#6f4627]/30"
                >
                  {content}
                </a>
              ) : (
                <div className="glass-card flex gap-4 rounded-[1.5rem] p-5">
                  {content}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

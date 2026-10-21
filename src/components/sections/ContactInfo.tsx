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
      href: "tel:+6281269175252",
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
          {t("subtitle")}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">
          {t("title")}
        </h2>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-line divide-y divide-line">
        {contactDetails.map((detail, index) => {
          const content = (
            <>
              <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon name={detail.icon} size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="mb-1 text-sm font-semibold text-fg">
                  {detail.title}
                </h3>
                <div className="space-y-1">
                  {detail.items.map((line) => (
                    <p
                      key={line}
                      className="text-sm leading-relaxed text-fg-muted"
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
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              {detail.href ? (
                <a
                  href={detail.href}
                  className="flex gap-4 bg-subtle p-5 transition-colors hover:bg-white"
                >
                  {content}
                </a>
              ) : (
                <div className="flex gap-4 bg-subtle p-5">{content}</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";

const PERKS = [
  { key: "free", icon: "verified" },
  { key: "noCommitment", icon: "handshake" },
  { key: "fastReply", icon: "schedule" },
] as const;

/** Reassurances shown on inquiry forms so asking feels low-stakes. */
export function InquiryPerks({
  dark = false,
  className,
}: {
  dark?: boolean;
  className?: string;
}) {
  const t = useTranslations("leads.perks");
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-2", className)}>
      {PERKS.map(({ key, icon }) => (
        <li
          key={key}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm",
            dark ? "text-white/75" : "text-fg-2",
          )}
        >
          <Icon
            name={icon}
            size={16}
            className={dark ? "text-brand-bright" : "text-brand"}
          />
          {t(key)}
        </li>
      ))}
    </ul>
  );
}

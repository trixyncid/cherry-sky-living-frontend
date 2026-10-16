"use client";

/**
 * Shared pieces for the Operations pages (Leases, Renewals, Tenants, Staff):
 * people avatars, WhatsApp shortcut, deadline chips and lease-term progress.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { getInitials } from "@/features/admin/lib/format";
import { cn } from "@/lib/utils";
import { generateWhatsAppURL } from "@/lib/utils/format";

const AVATAR_TONES = [
  "bg-[#f3dedb] text-[#71130d]",
  "bg-[#dff3d6] text-[#2f6d22]",
  "bg-[#f9e3c8] text-[#8a5a2b]",
  "bg-[#e3e6f3] text-[#3a4a7a]",
  "bg-[#efe3f3] text-[#6b3a7a]",
  "bg-[#1c0b0a] text-[#f3dedb]",
];

/** Stable tone per person so avatars are recognisable between visits. */
function toneFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

export function Avatar({
  name,
  seed,
  className,
  muted,
}: {
  name: string;
  seed?: string;
  className?: string;
  muted?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        muted ? "bg-[#efeeeb] text-[#857f77]" : toneFor(seed ?? name),
        className ?? "size-10 text-sm",
      )}
    >
      {getInitials(name) || "?"}
    </span>
  );
}

export function WhatsAppButton({
  phone,
  message,
  label,
  compact,
}: {
  phone?: string | null;
  message?: string;
  label: string;
  compact?: boolean;
}) {
  if (!phone) return null;
  return (
    <a
      href={generateWhatsAppURL(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#25D366] font-medium text-white transition-opacity hover:opacity-90",
        compact ? "size-10" : "h-10 px-4 text-sm",
      )}
    >
      <Icon name="whatsapp" size={18} />
      {compact ? null : label}
    </a>
  );
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** "in 3 days" / "today" / "2 days ago", coloured by urgency. */
export function DueChip({
  date,
  warnWithin = 7,
  className,
}: {
  date: string;
  warnWithin?: number;
  className?: string;
}) {
  const t = useTranslations("admin.pages.operations");
  const days = daysUntil(date);
  const label =
    days === 0
      ? t("today")
      : days > 0
        ? t("inDays", { count: days })
        : t("daysAgo", { count: -days });
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        days < 0
          ? "bg-[#fde2df] text-[#a1271b]"
          : days <= warnWithin
            ? "bg-[#f9e3c8] text-[#8a5a2b]"
            : "bg-[#f6f0ef] text-[#3d3a36]",
        className,
      )}
    >
      <Icon name="schedule" size={14} />
      {label}
    </span>
  );
}

/** Thin start → end bar with today's position. */
export function TermProgress({
  start,
  end,
  className,
}: {
  start: string;
  end: string;
  className?: string;
}) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  const pct =
    e > s ? Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100)) : 0;
  return (
    <div
      className={cn(
        "h-1.5 overflow-hidden rounded-full bg-[#f1ebea]",
        className,
      )}
      aria-hidden
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#e8bfb9,#71130d)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full ring-2 ring-white",
        active ? "bg-[#34a853]" : "bg-[#c9c2bd]",
      )}
    />
  );
}

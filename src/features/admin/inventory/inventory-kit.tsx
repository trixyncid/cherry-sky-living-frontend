"use client";

/**
 * Shared pieces for the Inventory pages (Properties, Room types, Pricing).
 * Each page has its own layout; these keep photos, money and meters
 * consistent between them.
 */

import Image from "next/image";
import type { ReactNode } from "react";
import { Icon } from "@/components/shared/Icon";
import { formatIdrCompact } from "@/features/admin/lib/format";
import { Link } from "@/i18n/routing";
import { DAILY_DURATION_DAYS, MONTHLY_DURATION_DAYS } from "@/lib/billing";
import type { Property, Unit, UnitPricing, UnitType } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

/** List payloads include more than the base types declare. */
export type UnitTypeWithInventory = UnitType & {
  pricings?: UnitPricing[];
  units?: Unit[];
};
export type PropertyWithInventory = Property & {
  unitTypes?: UnitTypeWithInventory[];
};

export const panel = "rounded-[1.75rem] bg-white";

export function rupiah(amount: number): string {
  return `Rp ${formatIdrCompact(amount)}`;
}

export function priceFor(
  pricings: UnitPricing[] | undefined,
  durationDays: number,
): number | null {
  return pricings?.find((p) => p.durationDays === durationDays)?.price ?? null;
}

export const monthlyOf = (p?: UnitPricing[]) =>
  priceFor(p, MONTHLY_DURATION_DAYS);
export const dailyOf = (p?: UnitPricing[]) => priceFor(p, DAILY_DURATION_DAYS);

/** First image attachment (skips PDFs). */
export function firstPhoto(
  attachments?: { url: string; contentType?: string | null }[],
): string | undefined {
  return attachments?.find(
    (a) =>
      !a.contentType?.includes("pdf") && !/\.pdf(?:$|\?)/i.test(a.url ?? ""),
  )?.url;
}

export function Photo({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 40vw, 100vw",
  fallbackLabel,
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  fallbackLabel?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[linear-gradient(135deg,#f3dedb,#e8bfb9)]",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[#71130d]/70">
          <Icon name="add_photo_alternate" size={28} />
          {fallbackLabel ? (
            <span className="text-xs font-medium">{fallbackLabel}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Two-tone meter: vacant (green) share of total. */
export function VacancyMeter({
  vacant,
  total,
  className,
}: {
  vacant: number;
  total: number;
  className?: string;
}) {
  const occupiedPct = total > 0 ? ((total - vacant) / total) * 100 : 0;
  return (
    <div
      className={cn(
        "flex h-2 overflow-hidden rounded-full bg-[#dff3d6]",
        className,
      )}
      aria-hidden
    >
      <div
        className="rounded-full bg-[#71130d] transition-[width] duration-700"
        style={{ width: `${occupiedPct}%` }}
      />
    </div>
  );
}

export function IconAction({
  icon,
  label,
  href,
  onClick,
  disabled,
  tone = "light",
}: {
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "light" | "danger" | "glass";
}) {
  const cls = cn(
    "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40",
    tone === "light" &&
      "border border-[#ece4e2] bg-white text-[#3d3a36] hover:border-[#e8bfb9] hover:text-[#71130d]",
    tone === "danger" &&
      "border border-[#ece4e2] bg-white text-[#a1271b] hover:border-[#f5c2bd] hover:bg-[#fdecea]",
    tone === "glass" &&
      "border border-white/25 bg-black/25 text-white backdrop-blur-md hover:bg-black/40",
    disabled && "pointer-events-none opacity-40",
  );
  if (href)
    return (
      <Link href={href} aria-label={label} title={label} className={cls}>
        <Icon name={icon} size={18} />
      </Link>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cls}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

export function EmptyPanel({
  icon,
  title,
  hint,
  action,
}: {
  icon: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        panel,
        "flex flex-col items-center gap-3 px-6 py-14 text-center",
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-[#f6f0ef] text-[#71130d]">
        <Icon name={icon} size={26} />
      </span>
      <p className="text-lg font-medium text-[#141414]">{title}</p>
      {hint ? (
        <p className="max-w-sm text-[15px] text-[#6b6b6b]">{hint}</p>
      ) : null}
      {action}
    </div>
  );
}

export function SkeletonCards({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          key={i}
          className={cn(panel, "h-72 animate-pulse bg-white/70")}
        />
      ))}
    </div>
  );
}

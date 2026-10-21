"use client";

/**
 * Live previews for create/edit forms — show the thing being made exactly
 * the way it will appear elsewhere in the portal, updating as you type.
 */

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Icon } from "@/components/shared/Icon";
import { Photo, rupiah } from "@/features/admin/inventory/inventory-kit";
import { formatDate, formatIdrTable } from "@/features/admin/lib/format";
import { Avatar } from "@/features/admin/operations/ops-kit";
import { parseUnitFloor } from "@/features/admin/units/lib/group-units-for-map";
import { isValidIndonesianPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export function PreviewShell({ children }: { children: ReactNode }) {
  const t = useTranslations("admin.form");
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-line bg-white">
      <p className="flex items-center justify-between gap-2 border-b border-line px-5 py-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-fg">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          {t("preview")}
        </span>
        <span className="text-xs text-fg-muted">{t("previewHint")}</span>
      </p>
      {children}
    </section>
  );
}

const placeholder = (value: string, fallback: string) =>
  value.trim() ? value : fallback;

export function PropertyPreview({
  name,
  city,
  address,
  photo,
  dueDay,
  lateFee,
}: {
  name: string;
  city: string;
  address: string;
  photo?: string;
  dueDay: string;
  lateFee: number;
}) {
  const t = useTranslations("admin.preview");
  return (
    <PreviewShell>
      <div className="relative">
        <Photo
          src={photo}
          alt=""
          fallbackLabel={t("photoLater")}
          className="aspect-[16/10] w-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(11_11_13/0.85),transparent_60%)]" />
        {city.trim() ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium">
            {city}
          </span>
        ) : null}
        <div className="absolute inset-x-4 bottom-3 text-white">
          <p className="truncate text-xl font-medium tracking-tight">
            {placeholder(name, t("propertyName"))}
          </p>
          <p className="truncate text-sm text-white/80">
            {placeholder(address, t("address"))}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 p-4 text-sm">
        <div className="rounded-2xl bg-subtle p-3">
          <dt className="text-xs text-fg-muted">{t("rentDue")}</dt>
          <dd className="font-medium">
            {dueDay ? t("dayOfMonth", { day: dueDay }) : "—"}
          </dd>
        </div>
        <div className="rounded-2xl bg-subtle p-3">
          <dt className="text-xs text-fg-muted">{t("lateFee")}</dt>
          <dd className="font-medium">
            {lateFee > 0 ? `${rupiah(lateFee)}${t("perDay")}` : "—"}
          </dd>
        </div>
      </dl>
    </PreviewShell>
  );
}

export function UnitTypePreview({
  name,
  description,
  size,
  propertyName,
  photo,
  monthly,
}: {
  name: string;
  description: string;
  size: string;
  propertyName?: string;
  photo?: string;
  monthly?: number | null;
}) {
  const t = useTranslations("admin.preview");
  const sqm = Number(size);
  return (
    <PreviewShell>
      <div className="relative">
        <Photo
          src={photo}
          alt=""
          fallbackLabel={t("photoLater")}
          className="aspect-[16/10] w-full"
        />
        {sqm > 0 ? (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium">
            <Icon name="square_foot" size={14} />
            {sqm} m²
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        <p className="text-lg font-medium tracking-tight">
          {placeholder(name, t("roomTypeName"))}
        </p>
        {propertyName ? (
          <p className="text-sm text-fg-muted">{propertyName}</p>
        ) : null}
        <p className="line-clamp-3 text-sm text-fg-2">
          {description.trim() || t("descriptionHint")}
        </p>
        <p className="rounded-2xl bg-subtle px-3 py-2 text-sm">
          {monthly ? (
            <>
              <span className="font-medium">{rupiah(monthly)}</span>
              <span className="text-fg-muted">{t("perMonth")}</span>
              {sqm > 0 ? (
                <span className="text-fg-muted">
                  {" "}
                  · {rupiah(Math.round(monthly / sqm))}/m²
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-fg-muted">{t("priceAfter")}</span>
          )}
        </p>
      </div>
    </PreviewShell>
  );
}

export function UnitPreview({
  name,
  maxOccupancy,
  propertyName,
  unitTypeName,
}: {
  name: string;
  maxOccupancy: string;
  propertyName?: string;
  unitTypeName?: string;
}) {
  const t = useTranslations("admin.preview");
  const floor = name.trim() ? parseUnitFloor(name) : null;
  const floors = Math.max(3, (floor ?? 0) + 1);
  return (
    <PreviewShell>
      <div className="flex items-center gap-5 p-5">
        {/* Mini building: the inferred floor lights up */}
        <div className="flex flex-col-reverse gap-1" aria-hidden>
          {Array.from({ length: Math.min(floors, 6) }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed floor order
            <div key={i} className="flex gap-1">
              {[0, 1, 2].map((c) => (
                <span
                  key={c}
                  className={cn(
                    "h-4 w-5 rounded-[3px]",
                    i === floor && c === 1
                      ? "bg-brand shadow-[0_0_8px_rgb(122_22_48/0.5)]"
                      : i === floor
                        ? "bg-brand-soft"
                        : "bg-hover",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-medium tracking-tight">
            {placeholder(name, t("roomNumber"))}
          </p>
          <p className="text-sm text-fg-muted">
            {floor !== null ? t("floorInferred", { floor }) : t("floorUnknown")}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 px-4 pb-4 text-sm">
        <div className="rounded-2xl bg-subtle p-3">
          <dt className="text-xs text-fg-muted">{t("building")}</dt>
          <dd className="truncate font-medium">{propertyName || "—"}</dd>
        </div>
        <div className="rounded-2xl bg-subtle p-3">
          <dt className="text-xs text-fg-muted">{t("roomType")}</dt>
          <dd className="truncate font-medium">{unitTypeName || "—"}</dd>
        </div>
        <div className="col-span-2 rounded-2xl bg-subtle p-3">
          <dt className="text-xs text-fg-muted">{t("capacity")}</dt>
          <dd className="font-medium">
            {Number(maxOccupancy) > 0
              ? t("people", { count: Number(maxOccupancy) })
              : "—"}
          </dd>
        </div>
      </dl>
    </PreviewShell>
  );
}

export function PricingPreview({
  monthly,
  daily,
  unitTypeName,
  propertyName,
}: {
  monthly: number;
  daily: number;
  unitTypeName?: string;
  propertyName?: string;
}) {
  const t = useTranslations("admin.preview");
  const saving =
    monthly > 0 && daily > 0 && daily * 30 > monthly
      ? Math.round((1 - monthly / (daily * 30)) * 100)
      : null;
  const dailyTooHigh = monthly > 0 && daily > 0 && daily * 30 < monthly;
  return (
    <PreviewShell>
      <div className="space-y-3 p-5">
        <div>
          <p className="text-sm text-fg-muted">
            {propertyName || t("building")}
          </p>
          <p className="text-lg font-medium tracking-tight">
            {unitTypeName || t("roomType")}
          </p>
        </div>
        <div className="rounded-2xl bg-ink p-4 text-white">
          <p className="text-xs text-white/70">{t("monthly")}</p>
          <p className="text-2xl font-medium tabular-nums">
            {monthly > 0 ? `Rp ${formatIdrTable(monthly)}` : "—"}
          </p>
          <p className="mt-2 text-xs text-white/70">{t("daily")}</p>
          <p className="text-lg tabular-nums">
            {daily > 0 ? `Rp ${formatIdrTable(daily)}` : "—"}
          </p>
        </div>
        {saving !== null ? (
          <p className="flex items-center gap-2 rounded-2xl bg-success-soft p-3 text-sm text-success">
            <Icon name="savings" size={18} />
            {t("monthlySaves", {
              pct: saving,
              amount: rupiah(daily * 30 - monthly),
            })}
          </p>
        ) : null}
        {dailyTooHigh ? (
          <p className="flex items-start gap-2 rounded-2xl bg-warning-soft/70 p-3 text-sm text-warning">
            <Icon name="lightbulb" size={18} className="mt-0.5 shrink-0" />
            {t("dailyCheaper")}
          </p>
        ) : null}
      </div>
    </PreviewShell>
  );
}

export function LedgerPreview({
  type,
  amount,
  categoryLabel,
  description,
  date,
  propertyName,
}: {
  type: "income" | "expense";
  amount: number;
  categoryLabel?: string;
  description: string;
  date: string;
  propertyName?: string;
}) {
  const t = useTranslations("admin.preview");
  const locale = useLocale();
  const income = type === "income";
  return (
    <PreviewShell>
      <div className="p-5">
        <p className="text-sm text-fg-muted">
          {date ? formatDate(date, locale) : t("pickDate")}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full",
              income
                ? "bg-success-soft text-success"
                : "bg-danger-soft text-danger",
            )}
          >
            <Icon name={income ? "south_west" : "north_east"} size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium">
              {placeholder(description, t("description"))}
            </p>
            <p className="truncate text-xs text-fg-muted">
              {propertyName || t("allProperties")} ·{" "}
              {categoryLabel || t("uncategorized")}
            </p>
          </div>
        </div>
        <p
          className={cn(
            "mt-4 text-right text-3xl font-medium tracking-tight tabular-nums",
            income ? "text-success" : "text-danger",
          )}
        >
          {income ? "+" : "−"} Rp {formatIdrTable(amount || 0)}
        </p>
      </div>
    </PreviewShell>
  );
}

export function PersonPreview({
  name,
  email,
  phone,
  role,
  roleLabel,
  roleHint,
}: {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  roleLabel?: string;
  roleHint?: string;
}) {
  const t = useTranslations("admin.preview");
  const phoneOk = phone ? isValidIndonesianPhone(phone) : null;
  return (
    <PreviewShell>
      <div className="flex items-center gap-4 p-5">
        <Avatar
          name={name || "?"}
          seed={name || "x"}
          className="size-16 text-xl"
        />
        <div className="min-w-0">
          <p className="truncate text-xl font-medium tracking-tight">
            {placeholder(name, t("fullName"))}
          </p>
          <p className="truncate text-sm text-fg-muted">
            {email || phone || t("contact")}
          </p>
          {roleLabel ? (
            <span
              className={cn(
                "mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                role === "superadmin"
                  ? "bg-ink text-white"
                  : "bg-brand-soft text-brand",
              )}
            >
              {roleLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-2 px-4 pb-4">
        {phone !== undefined ? (
          <p
            className={cn(
              "flex items-center gap-2 rounded-2xl p-3 text-sm",
              phoneOk
                ? "bg-success-soft text-success"
                : "bg-subtle text-fg-muted",
            )}
          >
            <Icon name="whatsapp" size={18} />
            {phoneOk ? t("waReady") : t("waNeedsPhone")}
          </p>
        ) : null}
        {roleHint ? (
          <p className="rounded-2xl bg-subtle p-3 text-sm text-fg-2">
            {roleHint}
          </p>
        ) : null}
      </div>
    </PreviewShell>
  );
}

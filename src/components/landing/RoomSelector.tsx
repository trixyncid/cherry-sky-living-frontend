/**
 * Room selector — one card per room type of the chosen property, all live:
 * price, what's included, availability badge. WhatsApp and "Jadwalkan
 * Survei" on every card; tapping the photo opens a sheet with the gallery.
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";
import { Icon } from "@/components/shared/Icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import type { RoomType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCapacity, formatCurrency } from "@/lib/utils/format";
import { SectionHeading } from "./SectionHeading";
import {
  monthlyPrice,
  type PropertyVM,
  trackWhatsApp,
  whatsappHref,
} from "./shared";

function Badge({ room }: { room: RoomType }) {
  const t = useTranslations("landing.rooms");
  const open = room.availableCount;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        open > 0
          ? "bg-success-soft text-success"
          : "bg-warning-soft text-warning",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          open > 0 ? "bg-success" : "bg-warning",
        )}
      />
      {open > 0
        ? t("left", { count: open })
        : room.waitlistEnabled
          ? t("soon")
          : t("full")}
    </span>
  );
}

export function RoomSelector({ vm }: { vm: PropertyVM }) {
  const t = useTranslations("landing.rooms");
  const locale = useLocale();
  const [detail, setDetail] = useState<RoomType | null>(null);
  const rooms = [
    ...(vm.kost?.roomTypes.filter((r) => r.totalCount > 0) ?? []),
  ].sort(
    (a, b) =>
      Number(b.availableCount > 0) - Number(a.availableCount > 0) ||
      monthlyPrice(a) - monthlyPrice(b),
  );
  const included = (vm.kost?.facilities ?? [])
    .filter((f) => f.category === "room")
    .slice(0, 4);

  return (
    <section
      id="kamar"
      aria-labelledby="kamar-heading"
      className="relative z-10 -mt-10 scroll-mt-16 rounded-t-[2.5rem] bg-canvas px-5 py-16 sm:px-8 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[90rem]">
        <SectionHeading
          id="kamar-heading"
          index={2}
          eyebrow={vm.name}
          lead={t("titleLead")}
          accent={t("titleAccent")}
          aside={t("aside")}
        />

        {!vm.kost ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[28rem] animate-pulse rounded-[1.5rem] bg-white"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <p className="mt-8 rounded-[1.5rem] bg-white p-6 text-fg-2">
            {t("none")}
          </p>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => {
              const ctx = {
                property: vm,
                roomType: room.name,
                section: "rooms",
              };
              const price = monthlyPrice(room);
              return (
                <li
                  key={room.id}
                  className="flex flex-col rounded-[2rem] bg-white p-2 shadow-[0_30px_60px_-45px_rgb(11_11_13/0.45)] transition-shadow duration-300 hover:shadow-[0_36px_70px_-40px_rgb(11_11_13/0.55)]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDetail(room);
                      track("gallery_open", {
                        property: vm.key,
                        roomType: room.name,
                      });
                    }}
                    aria-label={t("openGallery", { name: room.name })}
                    className="group relative aspect-[4/3] overflow-hidden rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lp-accent)]"
                  >
                    <Image
                      src={
                        room.images[0] ||
                        vm.kost?.thumbnail ||
                        vm.content.exteriorPhoto
                      }
                      alt={t("photoAlt", { room: room.name, name: vm.name })}
                      fill
                      sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110 group-focus-visible:scale-110"
                    />
                    <span className="absolute left-4 top-4">
                      <Badge room={room} />
                    </span>
                    {room.images.length > 1 ? (
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-white">
                        <Icon name="photo_library" size={14} />
                        {room.images.length}
                      </span>
                    ) : null}
                  </button>
                  <div className="flex flex-1 flex-col px-4 pb-3 pt-5">
                    <h3 className="text-xl font-semibold tracking-tight text-fg">
                      {room.name}
                    </h3>
                    <p className="mt-1 text-fg">
                      {price > 0 ? (
                        <>
                          <span className="text-2xl font-semibold tabular-nums">
                            {formatCurrency(price)}
                          </span>
                          <span className="text-fg-muted">{t("perMonth")}</span>
                        </>
                      ) : (
                        t("ask")
                      )}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-1.5 text-sm text-fg-2">
                      {room.size ? (
                        <li className="rounded-full bg-canvas px-3 py-1">
                          {room.size} m²
                        </li>
                      ) : null}
                      {room.capacity && room.capacity !== "—" ? (
                        <li className="rounded-full bg-canvas px-3 py-1">
                          {formatCapacity(
                            room.capacity,
                            locale === "en" ? "en" : "id",
                          )}
                        </li>
                      ) : null}
                      {vm.content.gender ? (
                        <li className="rounded-full bg-canvas px-3 py-1">
                          {t(`gender.${vm.content.gender}`)}
                        </li>
                      ) : null}
                      {included.map((f) => (
                        <li
                          key={f.id}
                          className="rounded-full bg-canvas px-3 py-1"
                        >
                          {locale === "en" ? (f.nameEn ?? f.name) : f.name}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
                      <a
                        href={whatsappHref(ctx, locale)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackWhatsApp(ctx)}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] px-3 text-sm font-semibold text-ink hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                      >
                        <Icon name="whatsapp" size={18} />
                        {t("whatsapp")}
                      </a>
                      {room.availableCount > 0 ? (
                        <SurveyScheduleDialog
                          triggerLabel={t("survey")}
                          className="mt-0 h-12 w-full justify-center rounded-full bg-canvas px-3 text-sm font-semibold text-fg hover:bg-hover"
                        />
                      ) : (
                        <LeadDialog
                          type="waitlist"
                          propertyId={vm.kost?.id}
                          propertyName={vm.name}
                          unitTypeId={room.id}
                          roomName={room.name}
                          trigger={
                            <button
                              type="button"
                              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-canvas px-3 text-sm font-semibold text-fg hover:bg-hover"
                            >
                              <Icon name="notifications" size={18} />
                              {t("waitlist")}
                            </button>
                          }
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Sheet
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-xl"
        >
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">{detail.name}</SheetTitle>
                <SheetDescription>
                  {vm.name}
                  {monthlyPrice(detail) > 0
                    ? ` · ${formatCurrency(monthlyPrice(detail))}${t("perMonth")}`
                    : ""}
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-3 px-4 pb-6">
                {(detail.images.length > 0
                  ? detail.images
                  : [vm.content.exteriorPhoto]
                ).map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas"
                  >
                    <Image
                      src={src}
                      alt={t("galleryAlt", { room: detail.name, n: i + 1 })}
                      fill
                      sizes="(min-width: 640px) 36rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                ))}
                {detail.description ? (
                  <p className="text-fg-2">{detail.description}</p>
                ) : null}
                {vm.kost ? (
                  <Link
                    href={`/kosts/${vm.kost.id}/${detail.id}`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-hover"
                  >
                    {t("fullDetail")}
                    <Icon name="arrow_forward" size={18} />
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}

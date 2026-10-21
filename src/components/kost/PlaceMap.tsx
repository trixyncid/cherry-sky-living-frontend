"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Google Maps embed pinned to an address (no API key needed). */
export function PlaceMap({
  name,
  address,
  className,
}: {
  name: string;
  address: string;
  className?: string;
}) {
  const t = useTranslations("detail");
  const query = encodeURIComponent(`${name}, ${address}`);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] bg-line",
        className,
      )}
    >
      <iframe
        src={`https://www.google.com/maps?q=${query}&output=embed`}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={t("mapTitle", { name })}
      />
    </div>
  );
}

export function directionsUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
}

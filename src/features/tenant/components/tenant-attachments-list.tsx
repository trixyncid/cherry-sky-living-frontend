"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { attachmentDisplayName } from "@/features/admin/lib/attachments";
import { formatDate } from "@/features/admin/lib/format";

export type TenantAttachmentItem = {
  id: string;
  url: string;
  createdAt?: string;
  kindLabel?: string;
};

export function TenantAttachmentsList({
  attachments,
}: {
  attachments: TenantAttachmentItem[];
}) {
  const t = useTranslations("tenant.attachments");

  const visible = attachments.filter((item) => item.url);

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#e3e2e0] bg-[#faf9f6]/80 px-4 py-6 text-center text-sm text-[#83746b]">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {visible.map((item) => (
        <li
          key={item.id}
          className="flex gap-3 rounded-xl border border-[#e3e2e0]/80 bg-white/90 p-3 shadow-sm"
        >
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-[#efeeeb]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt=""
              className="size-full object-cover"
            />
          </a>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#1a1c1a]">
              {attachmentDisplayName(item.url)}
            </p>
            {item.kindLabel ? (
              <p className="mt-0.5 text-xs font-medium text-[#6f4627]">
                {item.kindLabel}
              </p>
            ) : null}
            {item.createdAt ? (
              <p className="mt-0.5 text-xs text-[#83746b]">
                {formatDate(item.createdAt)}
              </p>
            ) : null}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#6f4627] hover:text-[#805533]"
            >
              <Icon name="open_in_new" size={14} />
              {t("view")}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

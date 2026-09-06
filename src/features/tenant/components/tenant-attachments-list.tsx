"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import {
  attachmentDisplayName,
  isPdfAttachment,
} from "@/features/admin/lib/attachments";
import { formatDate } from "@/features/admin/lib/format";

export type TenantAttachmentItem = {
  id: string;
  url: string;
  createdAt?: string;
  kindLabel?: string;
  contentType?: string | null;
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
      <p className="rounded-xl border border-dashed border-white/50 bg-white/30 px-4 py-6 text-center text-sm text-[#83746b]">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {visible.map((item) => {
        const name = attachmentDisplayName(item.url);
        const pdf = isPdfAttachment(item);

        return (
          <li
            key={item.id}
            className="glass-panel-soft flex gap-3 rounded-xl p-3"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-white/40"
            >
              {pdf ? (
                <div className="flex size-full flex-col items-center justify-center gap-0.5 text-[#6f4627]">
                  <Icon name="description" size={22} />
                  <span className="px-1 text-[9px] font-semibold uppercase tracking-wide">
                    PDF
                  </span>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.url}
                  alt={name}
                  className="size-full object-cover"
                />
              )}
            </a>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1a1c1a]">
                {name}
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
        );
      })}
    </ul>
  );
}

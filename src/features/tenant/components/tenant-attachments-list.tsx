"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import {
  attachmentDisplayName,
  isPdfAttachment,
  isVideoAttachment,
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
      <p className="rounded-lg border border-line bg-subtle px-4 py-6 text-center text-sm text-fg-muted">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {visible.map((item) => {
        const name = attachmentDisplayName(item.url);
        const pdf = isPdfAttachment(item);
        const video = !pdf && isVideoAttachment(item);

        return (
          <li
            key={item.id}
            className="glass-panel-soft flex gap-3 rounded-xl p-3"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-subtle"
            >
              {pdf ? (
                <div className="flex size-full flex-col items-center justify-center gap-0.5 text-brand">
                  <Icon name="description" size={22} />
                  <span className="px-1 text-[9px] font-semibold uppercase tracking-wide">
                    PDF
                  </span>
                </div>
              ) : video ? (
                <>
                  {/* #t= shows the first frame as a thumbnail. */}
                  <video
                    src={`${item.url}#t=0.1`}
                    preload="metadata"
                    muted
                    playsInline
                    className="size-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                    <Icon name="play_circle" size={30} />
                  </span>
                </>
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
              <p className="truncate text-sm font-semibold text-fg">{name}</p>
              {item.kindLabel ? (
                <p className="mt-0.5 text-xs font-medium text-brand">
                  {item.kindLabel}
                </p>
              ) : null}
              {item.createdAt ? (
                <p className="mt-0.5 text-xs text-fg-muted">
                  {formatDate(item.createdAt)}
                </p>
              ) : null}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover"
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

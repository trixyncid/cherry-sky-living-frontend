"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import {
  attachmentDisplayName,
  type AdminAttachmentItem,
} from "@/features/admin/lib/attachments";
import { formatDate } from "@/features/admin/lib/format";

export function AdminAttachmentsList({
  attachments,
  onDelete,
  deletePending = false,
}: {
  attachments: AdminAttachmentItem[];
  onDelete: (id: string) => Promise<void>;
  deletePending?: boolean;
}) {
  const t = useTranslations("admin.attachments");
  const [deleteTarget, setDeleteTarget] = useState<AdminAttachmentItem | null>(
    null,
  );

  async function confirmDelete() {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    setDeleteTarget(null);
  }

  if (attachments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#e3e2e0] bg-[#faf9f6]/80 px-4 py-6 text-center text-sm text-[#83746b]">
        {t("empty")}
      </p>
    );
  }

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {attachments.map((item) => (
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
                alt={attachmentDisplayName(item.url)}
                className="size-full object-cover"
              />
            </a>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1a1c1a]">
                {attachmentDisplayName(item.url)}
              </p>
              {item.kindLabel ? (
                <p className="mt-0.5 text-xs font-medium text-[#71130d]">
                  {item.kindLabel}
                </p>
              ) : null}
              {item.createdAt ? (
                <p className="mt-0.5 text-xs text-[#83746b]">
                  {formatDate(item.createdAt)}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#71130d] hover:text-[#8a1a12]"
                >
                  <Icon name="open_in_new" size={14} />
                  {t("view")}
                </a>
                <button
                  type="button"
                  disabled={deletePending}
                  onClick={() => setDeleteTarget(item)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#ba1a1a] hover:text-[#93000a] disabled:opacity-50"
                >
                  <Icon name="delete" size={14} />
                  {t("remove")}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <AdminDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={
          deleteTarget ? attachmentDisplayName(deleteTarget.url) : ""
        }
        onConfirm={confirmDelete}
        pending={deletePending}
      />
    </>
  );
}

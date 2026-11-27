"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";

/**
 * Delete lives at the bottom of an edit page, not next to everyday buttons,
 * so a mis-tap on a list can't start it.
 */
export function AdminDangerZone({
  itemName,
  hint,
  consequence,
  onDelete,
  pending,
}: {
  itemName: string;
  /** One line under the heading: what deleting does. */
  hint: string;
  consequence?: string;
  onDelete: () => Promise<void>;
  pending?: boolean;
}) {
  const t = useTranslations("admin.crud");
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-danger/25 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-fg">{t("dangerTitle")}</h2>
        <p className="mt-0.5 text-sm text-fg-muted">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md border border-danger/40 px-4 text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-50"
      >
        <Icon name="delete" size={16} />
        {t("deleteConfirm")}
      </button>
      <AdminDeleteDialog
        open={open}
        onOpenChange={setOpen}
        itemName={itemName}
        consequence={consequence}
        pending={pending}
        onConfirm={async () => {
          await onDelete();
          setOpen(false);
        }}
      />
    </section>
  );
}

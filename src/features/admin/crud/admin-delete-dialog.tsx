"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void | Promise<void>;
  pending?: boolean;
  /** What else disappears with this item, shown as a warning. */
  consequence?: string;
  /** For big deletes: the admin must type the item's name to enable "Hapus". */
  requireTypedName?: boolean;
}

export function AdminDeleteDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  pending,
  consequence,
  requireTypedName = false,
}: AdminDeleteDialogProps) {
  const t = useTranslations("admin.crud");
  const inputId = useId();
  const [typed, setTyped] = useState("");
  const nameMatches =
    !requireTypedName ||
    typed.trim().toLowerCase() === itemName.trim().toLowerCase();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>{t("deleteTitleNamed", { name: itemName })}</DialogTitle>
          <DialogDescription>
            {t("deleteDescription", { name: itemName })}
          </DialogDescription>
        </DialogHeader>
        {consequence ? (
          <p className="rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
            {consequence}
          </p>
        ) : null}
        {requireTypedName ? (
          <div>
            <label
              htmlFor={inputId}
              className="mb-1.5 block text-sm font-medium text-fg"
            >
              {t("deleteTypeName", { name: itemName })}
            </label>
            <input
              id={inputId}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-base text-fg focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20"
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || !nameMatches}
            onClick={() => void onConfirm()}
          >
            {pending ? t("deleting") : t("deleteConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

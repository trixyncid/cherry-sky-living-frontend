"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStaffUserMutations } from "@/features/admin/hooks/use-admin-queries";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import type { StaffUser } from "@/lib/types/admin";

interface StaffResetPasswordDialogProps {
  user: StaffUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaffResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: StaffResetPasswordDialogProps) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.staff");
  const mutations = useStaffUserMutations();
  const [phase, setPhase] = useState<"confirm" | "result">("confirm");
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pending = mutations.resetPassword.isPending;

  useEffect(() => {
    if (!open) {
      setPhase("confirm");
      setTemporaryPassword(null);
      setError(null);
      setCopied(false);
    }
  }, [open]);

  async function handleConfirm() {
    if (!user) return;
    setError(null);
    try {
      const result = await mutations.resetPassword.mutateAsync(user.id);
      setTemporaryPassword(result.temporaryPassword);
      setPhase("result");
      showApiSuccess(tp("resetSuccess"));
    } catch (err) {
      const msg = getErrorMessage(err, tp("resetFailed"));
      setError(msg);
      showApiError(err, msg);
    }
  }

  async function handleCopy() {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!pending}>
        {phase === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle>{tp("resetTitle")}</DialogTitle>
              <DialogDescription>
                {tp("resetDescription", { name: user?.name ?? "" })}
              </DialogDescription>
            </DialogHeader>
            {error && <p className="text-sm text-danger">{error}</p>}
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
                disabled={pending || !user}
                onClick={() => void handleConfirm()}
              >
                {pending ? tp("resetting") : tp("resetConfirm")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{tp("resetResultTitle")}</DialogTitle>
              <DialogDescription>{tp("resetResultDescription")}</DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-line bg-subtle p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                {tp("temporaryPassword")}
              </p>
              <p className="font-mono text-lg font-semibold tracking-wide text-fg">
                {temporaryPassword}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void handleCopy()}>
                {copied ? tp("copied") : tp("copyPassword")}
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                {tp("done")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

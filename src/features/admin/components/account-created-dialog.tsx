"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateWhatsAppURL } from "@/lib/utils/format";

/**
 * After creating an account: show the login details once so the admin can
 * pass them on, instead of dropping them on another page with nothing.
 */
export function AccountCreatedDialog({
  open,
  name,
  login,
  password,
  whatsappPhone,
  onDone,
}: {
  open: boolean;
  name: string;
  /** What they type to sign in: a phone number or an email. */
  login: string;
  password: string;
  /** When set, offers "Kirim lewat WhatsApp" to this number. */
  whatsappPhone?: string;
  onDone: () => void;
}) {
  const t = useTranslations("admin.accountCreated");
  const [copied, setCopied] = useState(false);
  const message = t("message", { name, login, password });

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDone()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { name })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 rounded-lg border border-line bg-subtle p-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
              {t("login")}
            </dt>
            <dd className="mt-0.5 text-base font-medium text-fg">{login}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
              {t("password")}
            </dt>
            <dd className="mt-0.5 select-all font-mono text-lg font-semibold tracking-wide text-fg">
              {password}
            </dd>
          </div>
        </dl>
        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void copy()}>
              <Icon name={copied ? "check" : "content_copy"} size={16} />
              {copied ? t("copied") : t("copy")}
            </Button>
            {whatsappPhone ? (
              <Button type="button" variant="outline" asChild>
                <a
                  href={generateWhatsAppURL(whatsappPhone, message)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="whatsapp" size={16} />
                  {t("whatsapp")}
                </a>
              </Button>
            ) : null}
          </div>
          <Button type="button" onClick={onDone}>
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

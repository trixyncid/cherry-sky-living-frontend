"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";

/** Native share sheet where available; otherwise copies the link. */
export function ShareButton({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const t = useTranslations("detail");

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      // User dismissed the share sheet, or clipboard is blocked: no-op.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-sm font-semibold text-fg transition-colors hover:border-fg",
        className,
      )}
    >
      <Icon name="ios_share" size={16} />
      {t("share")}
    </button>
  );
}

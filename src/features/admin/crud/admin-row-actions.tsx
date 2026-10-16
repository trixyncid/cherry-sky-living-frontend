"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface AdminRowActionsProps {
  editHref: string;
  onDelete: () => void;
  disabled?: boolean;
  className?: string;
}

export function AdminRowActions({
  editHref,
  onDelete,
  disabled,
  className,
}: AdminRowActionsProps) {
  const t = useTranslations("admin.crud");

  return (
    <div
      className={cn(
        "flex justify-end gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100",
        className,
      )}
    >
      <Link
        href={editHref}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-[#efeeeb] hover:text-[#71130d]",
          disabled && "pointer-events-none opacity-50",
        )}
        aria-label={t("editTitle")}
      >
        <Icon name="edit" size={18} />
      </Link>
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className="inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-[#ffdad6]/60 hover:text-[#ba1a1a] disabled:opacity-50"
        aria-label={t("deleteConfirm")}
      >
        <Icon name="delete" size={18} />
      </button>
    </div>
  );
}

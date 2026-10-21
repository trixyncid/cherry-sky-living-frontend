import { useTranslations } from "next-intl";
import type { LedgerEntryType } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export function LedgerTypeBadge({ type }: { type: LedgerEntryType }) {
  const t = useTranslations("admin.pages.bookkeeping");
  const isIncome = type === "income";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isIncome
          ? "bg-success-soft text-success"
          : "bg-danger-soft text-danger",
      )}
    >
      {isIncome ? t("typeIncome") : t("typeExpense")}
    </span>
  );
}

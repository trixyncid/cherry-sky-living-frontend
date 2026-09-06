import type { LedgerEntryType } from "@/lib/types/admin";

/** Mirrors backend `ledger-entry.schema` income categories. */
export const LEDGER_INCOME_CATEGORIES = [
  "rent",
  "deposit",
  "late_fee",
  "other_income",
] as const;

/** Mirrors backend `ledger-entry.schema` expense categories. */
export const LEDGER_EXPENSE_CATEGORIES = [
  "utilities",
  "maintenance",
  "cleaning",
  "staff",
  "supplies",
  "tax",
  "other_expense",
] as const;

export type LedgerIncomeCategory = (typeof LEDGER_INCOME_CATEGORIES)[number];
export type LedgerExpenseCategory = (typeof LEDGER_EXPENSE_CATEGORIES)[number];
export type LedgerCategory = LedgerIncomeCategory | LedgerExpenseCategory;

export function ledgerCategoriesForType(
  type: LedgerEntryType,
): readonly LedgerCategory[] {
  return type === "income"
    ? LEDGER_INCOME_CATEGORIES
    : LEDGER_EXPENSE_CATEGORIES;
}

export function isLedgerCategoryForType(
  type: LedgerEntryType,
  category: string,
): category is LedgerCategory {
  return (ledgerCategoriesForType(type) as readonly string[]).includes(
    category,
  );
}

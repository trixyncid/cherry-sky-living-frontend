import type { LedgerEntry, LedgerSummary } from "@/lib/types/admin";

function isActiveLedgerEntry(entry: LedgerEntry): boolean {
  return entry.reversedAt == null;
}

export function computeLedgerSummary(entries: LedgerEntry[]): LedgerSummary {
  const active = entries.filter(isActiveLedgerEntry);
  const income = active
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const expense = active
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);
  return { income, expense, net: income - expense };
}

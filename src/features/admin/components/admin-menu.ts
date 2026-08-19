import { cn } from "@/lib/utils";

/** Shared option row for custom selects and combobox menus. */
export function adminMenuItemClassName({
  active,
  selected,
}: {
  active?: boolean;
  selected?: boolean;
}) {
  return cn(
    "flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
    active || selected
      ? "bg-[#efe0d2] text-[#1a1c1a]"
      : "text-[#51443c] hover:bg-[#f6f1ec]",
  );
}

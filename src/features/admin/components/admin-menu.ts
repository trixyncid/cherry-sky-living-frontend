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
      ? "bg-[#f1efec] text-[#141414]"
      : "text-[#3d3a36] hover:bg-[#f6f5f3]",
  );
}

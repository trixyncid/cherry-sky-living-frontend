/** CSS custom property names from globals.css (--chart-1 … --chart-5). */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export const CHART_INCOME = "var(--chart-3)";
export const CHART_EXPENSE = "var(--chart-5)";
export const CHART_NET = "var(--chart-1)";
export const CHART_OCCUPIED = "var(--chart-1)";
export const CHART_VACANT = "var(--chart-2)";

export const CHART_AXIS = {
  stroke: "var(--adm-line-strong)",
  tick: { fill: "var(--adm-fg-muted)", fontSize: 11 },
  grid: "rgb(11 11 13 / 0.06)",
} as const;

export function chartColorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]!;
}

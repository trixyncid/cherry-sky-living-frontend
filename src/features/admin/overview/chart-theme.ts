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
  stroke: "#dcdad6",
  tick: { fill: "#6b6b6b", fontSize: 11 },
  grid: "rgb(20 16 14 / 0.06)",
} as const;

export function chartColorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]!;
}

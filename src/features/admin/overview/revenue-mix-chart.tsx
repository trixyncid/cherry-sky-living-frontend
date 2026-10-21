"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatIdrCompact } from "@/features/admin/lib/format";
import { chartColorAt } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

type MixSlice = { category: string; amount: number };

export function RevenueMixChart({
  slices,
  categoryLabel,
}: {
  slices: MixSlice[];
  categoryLabel: (category: string) => string;
}) {
  const data = slices
    .filter((s) => s.amount > 0)
    .map((s) => ({
      name: categoryLabel(s.category),
      value: s.amount,
      category: s.category,
    }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="42%"
          cy="50%"
          innerRadius={58}
          outerRadius={82}
          paddingAngle={2}
          stroke="rgb(255 255 255 / 0.65)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={data[i]!.category} fill={chartColorAt(i)} />
          ))}
        </Pie>
        <Tooltip
          content={<ChartTooltip valueFormatter={(v) => formatIdrCompact(v)} />}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--adm-fg-2)", lineHeight: "1.6" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_OCCUPIED, CHART_VACANT } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

type VacancyRow = {
  unitTypeName: string;
  vacant: number;
  occupied: number;
  total: number;
};

export function VacancyByTypeChart({
  rows,
  labels,
}: {
  rows: VacancyRow[];
  labels: { occupied: string; vacant: string };
}) {
  const data = rows.map((r) => ({
    name: r.unitTypeName,
    occupied: r.occupied,
    vacant: r.vacant,
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
        barCategoryGap="28%"
      >
        <CartesianGrid stroke={CHART_AXIS.grid} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={CHART_AXIS.tick}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={88}
          axisLine={false}
          tickLine={false}
          tick={CHART_AXIS.tick}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={(v) => String(v)} />}
          cursor={{ fill: "rgb(111 70 39 / 0.06)" }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#51443c", paddingBottom: 4 }}
        />
        <Bar
          dataKey="occupied"
          name={labels.occupied}
          stackId="occ"
          fill={CHART_OCCUPIED}
          radius={[0, 0, 0, 0]}
          maxBarSize={18}
        />
        <Bar
          dataKey="vacant"
          name={labels.vacant}
          stackId="occ"
          fill={CHART_VACANT}
          radius={[0, 6, 6, 0]}
          maxBarSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

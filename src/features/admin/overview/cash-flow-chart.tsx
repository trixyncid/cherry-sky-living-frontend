"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatIdrCompact } from "@/features/admin/lib/format";
import {
  CHART_AXIS,
  CHART_EXPENSE,
  CHART_INCOME,
  CHART_NET,
} from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

type CashFlowMonth = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

function formatMonthLabel(month: string, locale: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  // Pin UTC so SSR and client never disagree on the calendar month.
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function CashFlowChart({
  months,
  locale,
  labels,
}: {
  months: CashFlowMonth[];
  locale: string;
  labels: {
    income: string;
    expense: string;
    net: string;
  };
}) {
  const data = months.map((row) => ({
    ...row,
    label: formatMonthLabel(row.month, locale),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        barGap={4}
      >
        <defs>
          <linearGradient id="cashNetFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_NET} stopOpacity={0.22} />
            <stop offset="100%" stopColor={CHART_NET} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_AXIS.grid} vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={CHART_AXIS.tick}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={CHART_AXIS.tick}
          width={52}
          tickFormatter={(v: number) => formatIdrCompact(v)}
        />
        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={(l) => l}
              valueFormatter={(v) => formatIdrCompact(v)}
            />
          }
        />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--adm-fg-2)", paddingBottom: 8 }}
        />
        <Bar
          dataKey="income"
          name={labels.income}
          fill={CHART_INCOME}
          radius={[6, 6, 0, 0]}
          maxBarSize={22}
        />
        <Bar
          dataKey="expense"
          name={labels.expense}
          fill={CHART_EXPENSE}
          radius={[6, 6, 0, 0]}
          maxBarSize={22}
        />
        <Area
          type="monotone"
          dataKey="net"
          name={labels.net}
          stroke={CHART_NET}
          strokeWidth={2}
          fill="url(#cashNetFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

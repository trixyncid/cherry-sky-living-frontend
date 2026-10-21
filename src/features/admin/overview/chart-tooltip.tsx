"use client";

import type { ReactNode } from "react";
import { formatIdrCompact } from "@/features/admin/lib/format";

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
  labelFormatter?: (label: string | number) => ReactNode;
  valueFormatter?: (value: number, name: string) => string;
};

export function ChartTooltip({
  active,
  label,
  payload,
  labelFormatter,
  valueFormatter = (value) => formatIdrCompact(value),
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/50 bg-white/95 px-3 py-2.5 shadow-[0_12px_40px_rgb(11_11_13/0.12)] backdrop-blur-md">
      {label != null && label !== "" && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((item) => {
          const name = String(item.name ?? item.dataKey ?? "");
          const raw = item.value;
          const num = typeof raw === "number" ? raw : Number(raw);
          return (
            <li
              key={name}
              className="flex items-center gap-2 text-sm text-fg"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: item.color ?? "var(--chart-1)" }}
              />
              <span className="text-fg-2">{name}</span>
              <span className="ml-auto font-semibold tabular-nums">
                {Number.isFinite(num) ? valueFormatter(num, name) : String(raw)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

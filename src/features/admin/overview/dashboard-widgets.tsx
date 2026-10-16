/**
 * Dashboard widgets in the reference layout, using the brand palette:
 * cherry #71130d (primary), blush #e8bfb9 (secondary), deep wine #1c0b0a
 * (dark card), cherry-white canvas. All values come from live data.
 */

"use client";

import Image from "next/image";
import { useId, useMemo } from "react";
import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";

export const card = "rounded-[1.75rem] bg-white p-4 sm:p-6";

/* ——— Segmented toggle (Weekly | Monthly style) ——— */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  tone = "light",
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  tone?: "light" | "dark";
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full shrink-0 overflow-x-auto rounded-full p-1",
        tone === "dark"
          ? "bg-white/10"
          : "border border-[#ddd3cf] bg-[#efe8e6]",
      )}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm transition-colors",
            value === o.id
              ? tone === "dark"
                ? "bg-white text-[#1c0b0a] shadow-sm"
                : "bg-white font-medium text-[#141414] shadow-[0_1px_3px_rgb(28_11_10/0.18)]"
              : tone === "dark"
                ? "text-white/70 hover:text-white"
                : "text-[#3d3a36] hover:text-[#141414]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ——— KPI card ——— */
export function KpiCard({
  icon,
  label,
  value,
  badge,
  note,
  loading,
}: {
  icon: string;
  label: string;
  value: string;
  badge?: { text: string; tone: "up" | "down" | "neutral" };
  note?: string;
  loading?: boolean;
}) {
  return (
    <section className={cn(card, "flex flex-col gap-4")}>
      <p className="flex items-center gap-2.5 text-[15px] text-[#3d3a36]">
        <span className="flex size-9 items-center justify-center rounded-full bg-[#f6f0ef] text-[#71130d]">
          <Icon name={icon} size={18} />
        </span>
        {label}
      </p>
      <p className="text-[clamp(1.6rem,2.2vw,2rem)] font-medium tracking-[-0.03em] text-[#141414] tabular-nums">
        {loading ? (
          <span className="inline-block h-8 w-24 animate-pulse rounded-lg bg-[#f6f0ef]" />
        ) : (
          value
        )}
      </p>
      <p className="flex flex-wrap items-center gap-2 text-xs text-[#6b6b6b]">
        {badge ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
              badge.tone === "up" && "bg-[#dff3d6] text-[#2f6d22]",
              badge.tone === "down" && "bg-[#fde2df] text-[#a1271b]",
              badge.tone === "neutral" && "bg-[#f6f0ef] text-[#71130d]",
            )}
          >
            {badge.tone === "up" ? (
              <Icon name="arrow_drop_up" size={16} />
            ) : null}
            {badge.tone === "down" ? (
              <Icon name="arrow_drop_down" size={16} />
            ) : null}
            {badge.text}
          </span>
        ) : null}
        {note}
      </p>
    </section>
  );
}

/* ——— Cashflow: glowing line chart on deep wine ——— */
function smoothPath(points: [number, number][]): string {
  const first = points[0];
  if (!first || points.length < 2) return "";
  let d = `M ${first[0]} ${first[1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i] ?? first;
    const p0 = points[i - 1] ?? p1;
    const p2 = points[i + 1] ?? p1;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function CashflowChart({
  months,
  series,
  monthLabel,
  formatValue,
  latestLabel,
}: {
  months: { month: string; income: number; expense: number }[];
  series: "income" | "expense";
  monthLabel: (m: string) => string;
  formatValue: (n: number) => string;
  latestLabel: string;
}) {
  const id = useId().replace(/:/g, "");
  // Sized close to the rendered width so 11–12px labels stay legible.
  const W = 340;
  const H = 230;
  const pad = { l: 40, r: 12, t: 44, b: 30 };
  const values = months.map((m) =>
    series === "income" ? m.income : m.expense,
  );
  const max = Math.max(1, ...values) * 1.15;
  const x = (i: number) =>
    pad.l +
    (months.length <= 1 ? 0 : (i / (months.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const pts = values.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const lastValue = values[values.length - 1] ?? 0;
  const ticks = [max, max / 2, 0];

  if (months.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${latestLabel}: ${formatValue(lastValue)}`}
    >
      <defs>
        <linearGradient id={`line-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#e8bfb9" />
          <stop offset="100%" stopColor="#d9534a" />
        </linearGradient>
        <linearGradient id={`area-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d9534a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d9534a" stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(t)}
            y2={y(t)}
            stroke="rgb(255 255 255 / 0.08)"
            strokeDasharray="3 5"
          />
          <text x={0} y={y(t) + 4} fill="rgb(255 255 255 / 0.5)" fontSize="11">
            {formatValue(t)}
          </text>
        </g>
      ))}
      {last ? (
        <path
          d={`${line} L ${last[0]} ${H - pad.b} L ${pad.l} ${H - pad.b} Z`}
          fill={`url(#area-${id})`}
        />
      ) : null}
      <path
        d={line}
        fill="none"
        stroke="#d9534a"
        strokeWidth="10"
        opacity="0.45"
        filter={`url(#glow-${id})`}
      />
      <path
        d={line}
        fill="none"
        stroke={`url(#line-${id})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {last ? (
        <g>
          <line
            x1={last[0]}
            x2={last[0]}
            y1={last[1]}
            y2={H - pad.b}
            stroke="rgb(255 255 255 / 0.4)"
          />
          <circle
            cx={last[0]}
            cy={last[1]}
            r="7"
            fill="#1c0b0a"
            stroke="#f3dedb"
            strokeWidth="3"
          />
          <text
            x={last[0] - 8}
            y={last[1] - 30}
            textAnchor="end"
            fill="rgb(255 255 255 / 0.6)"
            fontSize="11"
          >
            {latestLabel}
          </text>
          <text
            x={last[0] - 8}
            y={last[1] - 12}
            textAnchor="end"
            fill="#f3dedb"
            fontSize="18"
            fontWeight="600"
          >
            {formatValue(lastValue)}
          </text>
        </g>
      ) : null}
      {months.map((m, i) => (
        <text
          key={m.month}
          x={x(i)}
          y={H - 10}
          textAnchor="middle"
          fill={i === months.length - 1 ? "#ffffff" : "rgb(255 255 255 / 0.55)"}
          fontSize="11"
          fontWeight={i === months.length - 1 ? 600 : 400}
        >
          {monthLabel(m.month)}
        </text>
      ))}
    </svg>
  );
}

/* ——— Collections bars: current month cherry, previous blush, rest hatched ——— */
export function CollectionBars({
  months,
  monthLabel,
  formatValue,
}: {
  months: { month: string; income: number }[];
  monthLabel: (m: string) => string;
  formatValue: (n: number) => string;
}) {
  const max = Math.max(1, ...months.map((m) => m.income));
  return (
    <div className="rounded-2xl bg-[#faf7f6] p-4">
      <div className="flex h-36 items-end gap-3">
        {months.map((m, i) => {
          const isLast = i === months.length - 1;
          const isPrev = i === months.length - 2;
          return (
            <div
              key={m.month}
              className="flex h-full flex-1 flex-col justify-end gap-2"
            >
              <div
                title={`${monthLabel(m.month)}: ${formatValue(m.income)}`}
                className={cn(
                  "w-full rounded-xl transition-[height] duration-700",
                  isLast && "bg-[#71130d]",
                  isPrev && "bg-[#e8bfb9]",
                  !isLast &&
                    !isPrev &&
                    "bg-[repeating-linear-gradient(135deg,#ece3e1_0_2px,transparent_2px_7px)] ring-1 ring-inset ring-[#ece3e1]",
                )}
                style={{ height: `${Math.max(6, (m.income / max) * 100)}%` }}
              />
              <span
                className={cn(
                  "text-center text-xs",
                  isLast ? "font-semibold text-[#141414]" : "text-[#857f77]",
                )}
              >
                {monthLabel(m.month)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ——— Segmented semicircle gauge ——— */
export function OccupancyGauge({
  percent,
  caption,
}: {
  percent: number;
  caption: string;
}) {
  const segments = 18;
  const filled = Math.round(
    (Math.min(100, Math.max(0, percent)) / 100) * segments,
  );
  const cx = 160;
  const cy = 160;
  const rOuter = 150;
  const rInner = 104;
  const gap = 2.2; // degrees

  const arcs = useMemo(
    () =>
      Array.from({ length: segments }, (_, i) => {
        const a0 = 180 + (i * 180) / segments + gap / 2;
        const a1 = 180 + ((i + 1) * 180) / segments - gap / 2;
        const rad = (a: number) => (a * Math.PI) / 180;
        const p = (r: number, a: number) => [
          cx + r * Math.cos(rad(a)),
          cy + r * Math.sin(rad(a)),
        ];
        const [x0, y0] = p(rOuter, a0);
        const [x1, y1] = p(rOuter, a1);
        const [x2, y2] = p(rInner, a1);
        const [x3, y3] = p(rInner, a0);
        return `M ${x0} ${y0} A ${rOuter} ${rOuter} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${rInner} ${rInner} 0 0 0 ${x3} ${y3} Z`;
      }),
    [],
  );

  // Blush → cherry across the filled segments.
  const colorAt = (i: number) => {
    const t = filled <= 1 ? 1 : i / (filled - 1);
    const a = [232, 191, 185];
    const b = [113, 19, 13];
    const c = a.map((v, k) => Math.round(v + ((b[k] ?? v) - v) * t));
    return `rgb(${c[0]} ${c[1]} ${c[2]})`;
  };

  return (
    <div className="relative mx-auto w-full max-w-[17rem]">
      <svg
        viewBox="0 0 320 170"
        className="h-auto w-full"
        role="img"
        aria-label={`${Math.round(percent)}% ${caption}`}
      >
        {arcs.map((d, i) => (
          <path
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed segment order
            key={i}
            d={d}
            fill={i < filled ? colorAt(i) : "#f1ebea"}
            stroke={i < filled ? "none" : "#e6dedc"}
            strokeWidth="1"
          />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-[2.25rem] font-medium leading-none tracking-[-0.04em] text-[#141414] tabular-nums">
          {Math.round(percent)}%
        </p>
        <p className="mt-1 text-sm text-[#6b6b6b]">{caption}</p>
      </div>
    </div>
  );
}

/* ——— Small thumbnail with fallback ——— */
export function Thumb({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-xl bg-[#f1ebea]",
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes="80px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[#857f77]">
          <Icon name="apartment" size={18} />
        </span>
      )}
    </span>
  );
}

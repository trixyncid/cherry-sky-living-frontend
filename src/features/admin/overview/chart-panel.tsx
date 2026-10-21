"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsClient } from "./use-is-client";

function ChartSkeleton() {
  return (
    <div className="flex h-[220px] items-center justify-center">
      <div className="h-full w-full animate-pulse rounded-2xl bg-line/70" />
    </div>
  );
}

export function ChartPanel({
  title,
  subtitle,
  children,
  className,
  empty,
  loading,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  empty?: boolean;
  loading?: boolean;
}) {
  const isClient = useIsClient();

  let body: ReactNode;
  if (loading) {
    body = <ChartSkeleton />;
  } else if (empty) {
    body = (
      <div className="flex h-[220px] items-center justify-center rounded-2xl bg-white/35 px-6 text-center text-sm text-fg-muted">
        {children}
      </div>
    );
  } else if (!isClient) {
    // Recharts needs layout measurement + emits unstable SVG ids on SSR.
    body = <ChartSkeleton />;
  } else {
    body = <div className="h-[220px] w-full">{children}</div>;
  }

  return (
    <section
      className={cn(
        "glass-panel relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6",
        className,
      )}
    >
      <div className="mb-4">
        <h3 className="font-semibold tracking-tight text-fg">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-fg-muted">{subtitle}</p>
        )}
      </div>
      {body}
    </section>
  );
}

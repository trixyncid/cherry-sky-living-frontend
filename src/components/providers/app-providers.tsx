"use client";

import type { User } from "@/lib/types/auth";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { AnalyticsScripts } from "@/components/providers/analytics-scripts";

export function AppProviders({
  children,
  user = null,
}: {
  children: React.ReactNode;
  user?: User | null;
}) {
  return (
    <QueryProvider>
      <AuthProvider user={user}>
        {children}
        <Toaster />
        <AnalyticsScripts />
      </AuthProvider>
    </QueryProvider>
  );
}

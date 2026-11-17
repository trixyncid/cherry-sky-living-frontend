"use client";

import { AnalyticsScripts } from "@/components/providers/analytics-scripts";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import type { User } from "@/lib/types/auth";

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

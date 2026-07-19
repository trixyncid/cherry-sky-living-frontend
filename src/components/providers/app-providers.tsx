"use client";

import type { User } from "@/lib/types/auth";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";

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
      </AuthProvider>
    </QueryProvider>
  );
}

import { TenantMobileNav } from "@/features/tenant/components/tenant-mobile-nav";
import { TenantShellProvider } from "@/features/tenant/components/tenant-shell-context";
import { TenantTopNav } from "@/features/tenant/components/tenant-top-nav";
import { SessionGuard } from "@/lib/auth/session-guard";
import type { User } from "@/lib/types/auth";

interface TenantShellProps {
  children: React.ReactNode;
  user: User;
}

export function TenantShell({ children, user }: TenantShellProps) {
  return (
    <SessionGuard portal="tenant">
      <TenantShellProvider user={user}>
        <div className="tenant-atmosphere relative flex h-dvh flex-col overflow-hidden text-[#141414] antialiased">
          <TenantTopNav />
          <TenantMobileNav />
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-[1200px] px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
              {children}
            </div>
          </main>
        </div>
      </TenantShellProvider>
    </SessionGuard>
  );
}

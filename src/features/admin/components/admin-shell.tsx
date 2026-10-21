import { AdminMobileNav } from "@/features/admin/components/admin-mobile-nav";
import { AdminShellProvider } from "@/features/admin/components/admin-shell-context";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminTopNav } from "@/features/admin/components/admin-top-nav";
import { SessionGuard } from "@/lib/auth/session-guard";
import type { User } from "@/lib/types/auth";

interface AdminShellProps {
  children: React.ReactNode;
  user: User;
}

export function AdminShell({ children, user }: AdminShellProps) {
  return (
    <SessionGuard portal="admin">
      <AdminShellProvider user={user}>
        <div className="admin-atmosphere relative flex h-dvh overflow-hidden text-fg antialiased">
          {/* Desktop: black sidebar. Phones: bottom tab bar. */}
          <AdminSidebar />
          <AdminMobileNav />

          <div className="relative flex min-w-0 flex-1 flex-col">
            <AdminTopNav />
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="mx-auto w-full max-w-[1400px] px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </AdminShellProvider>
    </SessionGuard>
  );
}

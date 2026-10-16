import { AdminMobileNav } from "@/features/admin/components/admin-mobile-nav";
import { AdminRail } from "@/features/admin/components/admin-rail";
import { AdminShellProvider } from "@/features/admin/components/admin-shell-context";
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
        <div className="admin-atmosphere relative flex h-dvh flex-col overflow-hidden text-[#141414] antialiased">
          {/* Phones: bottom tab bar; desktop: top pills + floating icon rail. */}
          <AdminMobileNav />
          <AdminRail />

          <div className="relative flex min-h-0 flex-1 flex-col">
            <AdminTopNav />
            <main className="mx-auto min-h-0 w-full max-w-[1440px] flex-1 overflow-y-auto overscroll-contain px-4 pb-32 pt-5 sm:px-6 sm:pt-6 lg:pr-8 lg:pb-12 lg:pl-24 xl:pl-32">
              {children}
            </main>
          </div>
        </div>
      </AdminShellProvider>
    </SessionGuard>
  );
}

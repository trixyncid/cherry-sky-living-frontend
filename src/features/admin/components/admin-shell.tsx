import { AdminHeader } from "@/features/admin/components/admin-header";
import { AdminShellProvider } from "@/features/admin/components/admin-shell-context";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
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
        <div className="admin-atmosphere relative flex h-dvh flex-col overflow-hidden text-[#1a1c1a] antialiased">
          <div
            className="pointer-events-none fixed inset-0 opacity-40"
            aria-hidden
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
              backgroundRepeat: "repeat",
              backgroundSize: "180px 180px",
            }}
          />
          <div
            className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.18)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-50"
            aria-hidden
          />

          <AdminSidebar />

          <div className="relative flex min-h-0 flex-1 flex-col lg:pl-[300px]">
            <AdminHeader />
            <main className="mx-auto min-h-0 w-full max-w-[1440px] flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-12">
              {children}
            </main>
          </div>
        </div>
      </AdminShellProvider>
    </SessionGuard>
  );
}

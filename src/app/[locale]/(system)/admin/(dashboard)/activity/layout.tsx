import { redirect } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/guards";
import { UserRole } from "@/lib/types/auth";

export default async function ActivitySectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAdmin(locale);

  if (session.user.role !== UserRole.SUPERADMIN) {
    redirect({ href: "/admin", locale });
  }

  return children;
}

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLoginForm } from "@/features/admin";
import { requireGuest } from "@/lib/auth/guards";

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireGuest(locale);

  return (
    <Suspense fallback={<LoginFormFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}

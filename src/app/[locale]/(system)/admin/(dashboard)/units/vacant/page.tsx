import { redirect } from "@/i18n/routing";

/** "Kamar kosong" links open the room list already filtered to empty rooms. */
export default async function AdminVacantUnitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/admin/units?status=vacant", locale });
}

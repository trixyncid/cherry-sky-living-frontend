import { redirect } from "@/i18n/routing";

/** Prices now live on each room type's form; old links land there. */
export default async function NewPricingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ unitTypeId?: string }>;
}) {
  const { locale } = await params;
  const { unitTypeId } = await searchParams;
  redirect({
    href: unitTypeId
      ? `/admin/unit-types/${encodeURIComponent(unitTypeId)}/edit`
      : "/admin/unit-types",
    locale,
  });
}

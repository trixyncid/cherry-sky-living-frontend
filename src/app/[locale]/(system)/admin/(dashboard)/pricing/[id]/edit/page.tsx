import { redirect } from "@/i18n/routing";

/** Prices now live on each room type's form. */
export default async function EditPricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/admin/unit-types", locale });
}

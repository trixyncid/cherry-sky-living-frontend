/**
 * Root page - redirect to default locale so next-intl and layout apply.
 * The actual homepage is at [locale]/page.tsx.
 */

import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}

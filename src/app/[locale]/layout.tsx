import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppProviders } from "@/components/providers/app-providers";
import { routing } from "@/i18n/routing";
import "../globals.css";
import "flag-icons/css/flag-icons.min.css";
import "react-day-picker/style.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cherry Sky Living - Temukan Kost Impian Anda",
  description:
    "Kost nyaman dengan fasilitas lengkap di Medan. SKYKOST dan CHERRY KOST menawarkan kamar dengan AC, Wi-Fi cepat, dan fasilitas premium.",
  keywords: [
    "kost",
    "kost medan",
    "kost murah",
    "kost dekat kampus",
    "sewa kamar medan",
  ],
  icons: {
    icon: [{ url: "/cherry-sky-living-logo.svg", type: "image/svg+xml" }],
    shortcut: ["/cherry-sky-living-logo.svg"],
    apple: [{ url: "/cherry-sky-living-logo.svg" }],
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${plusJakarta.variable} antialiased font-sans`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

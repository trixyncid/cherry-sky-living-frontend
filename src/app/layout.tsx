import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cherry Sky Living",
  description: "Kost nyaman dengan fasilitas lengkap di Medan",
  icons: {
    icon: [{ url: "/cherry-sky-living-logo.svg", type: "image/svg+xml" }],
    shortcut: ["/cherry-sky-living-logo.svg"],
    apple: [{ url: "/cherry-sky-living-logo.svg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


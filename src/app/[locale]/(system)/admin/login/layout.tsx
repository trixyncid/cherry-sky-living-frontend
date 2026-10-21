import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  // Staff sign-in is not linked anywhere public; keep it out of search too.
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

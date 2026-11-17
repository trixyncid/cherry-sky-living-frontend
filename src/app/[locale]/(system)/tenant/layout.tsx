/**
 * Tenant Route Layout
 * Layout wrapper for tenant-related pages (login, register, dashboard, etc.)
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tenant Portal - Cherry Sky Living",
  description: "Manage your bookings and account on Cherry Sky Living",
};

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

"use client";

import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { LegalDocument } from "@/components/sections/LegalDocument";

export function LegalView() {
  return (
    <PublicPageShell hideCta>
      <LegalDocument namespace="privacy" />
    </PublicPageShell>
  );
}

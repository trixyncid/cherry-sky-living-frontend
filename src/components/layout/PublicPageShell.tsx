/**
 * Shared frame for public marketing pages: content, then the final
 * conversion panel, footer and floating CTA (§5.13–5.15).
 */

"use client";

import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/layout/Footer";
import { FinalCtaCard } from "@/components/sections/FinalCtaCard";
import {
  type FloatingCtaOptions,
  HomeFloatingCta,
} from "@/components/sections/HomeFloatingCta";
import { useKosts } from "@/lib/hooks/use-kost-data";

interface PublicPageShellProps {
  children: ReactNode;
  /** Hide the final CTA panel (e.g. pages that already end in a form). */
  hideCta?: boolean;
  /** Page-specific floating CTA (context-aware WhatsApp message etc.). */
  floating?: FloatingCtaOptions;
}

export function PublicPageShell({
  children,
  hideCta = false,
  floating,
}: PublicPageShellProps) {
  const { data: kosts, isLoading } = useKosts();

  return (
    <AppLayout>
      {children}

      <div id="contact">
        <Footer
          cta={
            hideCta ? undefined : (
              <FinalCtaCard kosts={kosts} isLoading={isLoading} />
            )
          }
        />
      </div>
      <HomeFloatingCta {...floating} />
    </AppLayout>
  );
}

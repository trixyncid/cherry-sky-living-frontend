"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

/** Keeps the tenant sidebar visible when a page inside it fails to render. */
export default function TenantPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      variant="error"
      homeHref="/tenant"
      onRetry={reset}
      digest={error.digest}
    />
  );
}

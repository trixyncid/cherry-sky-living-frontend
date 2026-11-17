"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

/** Keeps the admin sidebar visible when a page inside it fails to render. */
export default function AdminPortalError({
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
      homeHref="/admin"
      onRetry={reset}
      digest={error.digest}
    />
  );
}

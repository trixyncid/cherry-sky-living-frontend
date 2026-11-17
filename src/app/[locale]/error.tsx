"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function LocaleError({
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
      fullPage
      onRetry={reset}
      digest={error.digest}
    />
  );
}

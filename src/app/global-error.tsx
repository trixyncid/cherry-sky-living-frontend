"use client";

import "./globals.css";

/**
 * Last-resort boundary: the root layout itself failed, so there are no
 * translations or providers. Bilingual copy, plain markup.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-white px-4 font-sans text-fg antialiased">
        <main className="w-full max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Terjadi kesalahan · Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Halaman tidak dapat dimuat. Silakan coba lagi.
            <br />
            The page couldn&apos;t load. Please try again.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="h-10 rounded-full bg-brand px-5 text-sm font-medium text-white"
            >
              Coba lagi · Try again
            </button>
            <a
              href="/"
              className="inline-flex h-10 items-center rounded-full border border-line px-5 text-sm font-medium"
            >
              Beranda · Home
            </a>
          </div>
          {error.digest ? (
            <p className="mt-6 text-xs text-fg-faint">Ref: {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}

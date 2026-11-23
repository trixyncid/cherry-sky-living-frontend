"use client";

import type { CSSProperties } from "react";

/**
 * Last-resort boundary: the root layout itself failed, so there are no
 * translations or providers. Bilingual copy, plain markup.
 *
 * Styled inline on purpose. This file is bundled into every page, and
 * importing globals.css here makes the dev server track a second copy of
 * the stylesheet that no page links, which breaks CSS hot reload ("No link
 * element found for chunk …globals…css"). Inline styles also still work if
 * the stylesheet is what failed to load. Colours mirror the --adm-* tokens.
 */
const BRAND = "#7a1630";
const INK = "#0f0f11";
const MUTED = "#66666e";
const LINE = "#e6e6e9";

const pill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 40,
  padding: "0 20px",
  borderRadius: 9999,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "inherit",
  textDecoration: "none",
  cursor: "pointer",
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
          background: "#fff",
          color: INK,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main style={{ width: "100%", maxWidth: 448, textAlign: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            Terjadi kesalahan · Something went wrong
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              lineHeight: 1.625,
              color: MUTED,
            }}
          >
            Halaman tidak dapat dimuat. Silakan coba lagi.
            <br />
            The page couldn&apos;t load. Please try again.
          </p>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{ ...pill, border: 0, background: BRAND, color: "#fff" }}
            >
              Coba lagi · Try again
            </button>
            <a
              href="/"
              style={{
                ...pill,
                border: `1px solid ${LINE}`,
                background: "#fff",
                color: INK,
              }}
            >
              Beranda · Home
            </a>
          </div>
          {error.digest ? (
            <p style={{ margin: "24px 0 0", fontSize: 12, color: "#a1a1aa" }}>
              Ref: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}

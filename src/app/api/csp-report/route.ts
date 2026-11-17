/**
 * Receives Content-Security-Policy violation reports (the policy is
 * Report-Only for now, see next.config.ts) and logs them so they show up in
 * the hosting logs. Reports are capped and trimmed; nothing is stored.
 */
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: Request) {
  const text = await request.text().catch(() => "");
  if (text && text.length <= MAX_BODY_BYTES) {
    try {
      const body = JSON.parse(text) as {
        "csp-report"?: Record<string, unknown>;
      };
      const report = body["csp-report"] ?? body;
      console.warn("[csp-report]", {
        directive:
          (report as Record<string, unknown>)["effective-directive"] ??
          (report as Record<string, unknown>)["violated-directive"],
        blocked: (report as Record<string, unknown>)["blocked-uri"],
        page: (report as Record<string, unknown>)["document-uri"],
      });
    } catch {
      // Not JSON: ignore.
    }
  }
  return new Response(null, { status: 204 });
}

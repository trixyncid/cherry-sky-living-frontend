import { env } from "@/env";
import { getServerApiUrl } from "@/lib/api/base-url";
import {
  cookieHeaderForBackend,
  isSecureRequest,
  setCookieForBrowser,
} from "@/lib/auth/session-cookie";

/**
 * Same-origin API proxy — routes /api/backend/** to the Railway backend.
 *
 * WHY: In production the Next.js frontend (Vercel) and the API (Railway) live on
 * different origins. Browsers won't share cookies across origins, so a session
 * cookie set by Railway would never be sent back to the Vercel SSR process.
 *
 * FIX: Client-side auth and API calls go through this proxy instead. The proxy
 * rewrites Set-Cookie so the session cookie is stored on the Vercel domain, where
 * the Next.js server can read it and forward it to Railway for SSR session checks.
 */

/** Backend areas the browser may reach; everything else 404s here. */
const ALLOWED_PREFIXES = new Set([
  "auth",
  "public",
  "admin",
  "leases",
  "profile",
]);

/** Request headers worth forwarding; the rest stay on this side. */
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-forwarded-host",
  "x-forwarded-proto",
];

/**
 * The visitor's IP as the hosting platform saw it. On Vercel both headers are
 * set by the platform itself, not passed through from the client.
 */
function visitorIp(request: Request): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

const UPSTREAM_TIMEOUT_MS = 15_000;
// Large multipart uploads get longer; they're capped at a few MB anyway.
const UPLOAD_TIMEOUT_MS = 60_000;

function jsonError(status: number, code: string, message: string) {
  return Response.json(
    { success: false, error: { code, message } },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}

async function proxyRequest(request: Request, pathSegments: string[]) {
  const incomingUrl = new URL(request.url);
  if (
    !pathSegments.length ||
    !ALLOWED_PREFIXES.has(pathSegments[0] ?? "") ||
    pathSegments.some((s) => s === ".." || s === ".")
  ) {
    return jsonError(404, "NOT_FOUND", "Not found");
  }
  const targetPath = pathSegments.map(encodeURIComponent).join("/");
  const target = new URL(`${getServerApiUrl()}/${targetPath}`);
  target.search = incomingUrl.search;

  const forwardHeaders = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) forwardHeaders.set(name, value);
  }
  // Vouch for the visitor's IP so the backend rate-limits per visitor.
  const ip = visitorIp(request);
  if (ip) {
    // Read by a backend that doesn't have the shared secret yet.
    forwardHeaders.set("x-forwarded-for", ip);
    if (env.PROXY_SHARED_SECRET) {
      forwardHeaders.set("x-proxy-secret", env.PROXY_SHARED_SECRET);
      forwardHeaders.set("x-client-ip", ip);
    }
  }

  const cookie = forwardHeaders.get("cookie");
  if (cookie) {
    forwardHeaders.set("cookie", cookieHeaderForBackend(cookie));
  }

  const hasBody =
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.method !== "OPTIONS";

  // Buffer the body rather than streaming — Vercel's Node.js serverless runtime
  // does not reliably support streaming request bodies (duplex:"half").
  // Use arrayBuffer (not text) so multipart/form-data file uploads stay intact.
  let body: ArrayBuffer | undefined;
  if (hasBody) {
    body = await request.arrayBuffer();
  }

  const isMultipart = (request.headers.get("content-type") ?? "").startsWith(
    "multipart/",
  );
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(
        isMultipart ? UPLOAD_TIMEOUT_MS : UPSTREAM_TIMEOUT_MS,
      ),
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    console.error("[api-proxy] upstream request failed", {
      path: targetPath,
      method: request.method,
      reason: timedOut ? "timeout" : String(error),
    });
    return timedOut
      ? jsonError(
          504,
          "GATEWAY_TIMEOUT",
          "The server took too long to respond. Please try again.",
        )
      : jsonError(
          502,
          "BAD_GATEWAY",
          "The server is unavailable right now. Please try again shortly.",
        );
  }

  const responseHeaders = new Headers(upstream.headers);
  // Behind a TLS-terminating proxy request.url can look like http.
  const isHttps = isSecureRequest(request);

  // Rewrite every Set-Cookie header so the cookie lands on the Vercel domain.
  const setCookies =
    typeof responseHeaders.getSetCookie === "function"
      ? responseHeaders.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    responseHeaders.delete("set-cookie");
    for (const c of setCookies) {
      responseHeaders.append("set-cookie", setCookieForBrowser(c, isHttps));
    }
  }

  // Remove the upstream CORS headers — the browser sees this response as
  // same-origin, so Vercel's own CORS policy applies instead.
  responseHeaders.delete("access-control-allow-origin");
  responseHeaders.delete("access-control-allow-credentials");

  // Buffer the response body — streaming upstream.body through the Next.js
  // proxy can leave clients with an unreadable or empty body (fetch().json()
  // then fails even when the upstream returned 200 + JSON).
  const responseBody = await upstream.arrayBuffer();
  // upstream fetch decodes compressed bodies; drop encoding headers so clients
  // do not attempt to decompress an already-decoded buffer (causes Z_DATA_ERROR).
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.set("content-length", String(responseBody.byteLength));
  // API responses are per-user: never let a CDN or browser cache reuse them,
  // and never let a browser sniff them into HTML on this origin.
  responseHeaders.set("cache-control", "no-store");
  responseHeaders.set("x-content-type-options", "nosniff");

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;

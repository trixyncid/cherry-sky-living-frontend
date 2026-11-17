import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

/**
 * The Spaces bucket(s) photos are served from. Set STORAGE_IMAGE_HOSTS on
 * Vercel to the production bucket (comma-separated, e.g.
 * "mybucket.sgp1.digitaloceanspaces.com,mybucket.sgp1.cdn.digitaloceanspaces.com").
 * Defaults to the development bucket.
 */
const storageImageHosts = (
  process.env.STORAGE_IMAGE_HOSTS ??
  "trixync-dev-staging.sgp1.digitaloceanspaces.com,trixync-dev-staging.sgp1.cdn.digitaloceanspaces.com"
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

/**
 * Content Security Policy. Ships as Report-Only first: browsers log
 * violations (and POST them to /api/csp-report) without blocking anything.
 * Once the logs stay quiet, rename the header to Content-Security-Policy.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next injects inline bootstrap scripts; dev also needs eval for HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://plausible.io`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://*.digitaloceanspaces.com https://www.google.com https://maps.gstatic.com https://*.google-analytics.com https://www.googletagmanager.com",
  "media-src 'self' blob: https://*.digitaloceanspaces.com",
  // Video uploads PUT straight to Spaces; analytics beacons.
  `connect-src 'self' https://*.digitaloceanspaces.com https://plausible.io https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com${isDev ? " ws: http://localhost:*" : ""}`,
  "frame-src https://www.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "report-uri /api/csp-report",
].join("; ");

const securityHeaders = [
  // The admin / tenant portals must never be framed (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // One year, this host only (no includeSubDomains/preload: other
  // subdomains of a future custom domain may not be HTTPS yet).
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // Exact Spaces bucket hosts only (an open wildcard lets anyone use our
    // optimizer for any bucket). `search` stays unset: private documents are
    // signed URLs with query strings on the same host.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...storageImageHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
    ],
  },
};

export default withNextIntl(nextConfig);

import type { NextConfig } from "next";

/* Security headers for every response.
   The Content-Security-Policy only sets rules that can't break the site's inline boot script, JSON-LD or animations:
   no framing by other sites (clickjacking), no <base> hijacking, no plugins, forms post only to this site. */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "X-Frame-Options", value: "DENY" }, // older browsers that ignore frame-ancestors
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // browsers only honour this over HTTPS; it has no effect on localhost
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      /* Uploaded project screenshots are user-supplied files: keep their stricter policy (the route sets the same
         value, but a matching config header replaces it, so it must be repeated here; the later rule wins). */
      {
        source: "/api/project-shot/:slug*",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox; frame-ancestors 'none'" }],
      },
      // keep the admin area out of search engines
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;

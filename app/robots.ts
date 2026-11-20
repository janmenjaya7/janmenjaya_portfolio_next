import type { MetadataRoute } from "next";
import { DATA } from "./data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${DATA.siteUrl}/sitemap.xml`,
    host: DATA.siteUrl,
  };
}

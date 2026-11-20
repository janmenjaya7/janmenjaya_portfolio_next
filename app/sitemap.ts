import type { MetadataRoute } from "next";
import { DATA } from "./data";

/* Single-page site: sections are #anchors, which search engines don't index as separate URLs */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${DATA.siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

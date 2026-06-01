import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/**
 * robots.txt: allow crawling of public content, disallow the app/private areas,
 * and point crawlers at the sitemap. Drafts are already non-public, so only the
 * authenticated/app surfaces need blocking.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api", "/signin", "/auth", "/profile"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { listPostSlugsForSitemap, listTopicSlugsForSitemap } from "@/lib/topics-data";

/**
 * XML sitemap: static public routes + every published post and topic. Private
 * areas (dashboard, admin, api, auth, profile) are excluded here and disallowed
 * in robots.ts. Regenerated hourly so new posts/topics show up without a deploy.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/topics`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const [posts, topics] = await Promise.all([
    listPostSlugsForSitemap(),
    listTopicSlugsForSitemap(),
  ]);

  const topicRoutes: MetadataRoute.Sitemap = topics.map((t) => ({
    url: `${base}/topics/${t.slug}`,
    lastModified: t.lastModified,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/posts/${p.slug}`,
    lastModified: p.lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...topicRoutes, ...postRoutes];
}

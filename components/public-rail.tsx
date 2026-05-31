import { quickTopics } from "@/lib/familypulse-data";
import { listPopularPosts } from "@/lib/topics-data";
import type { PopularPost } from "@/lib/familypulse-data";
import { AdSlot } from "./ad-slot";
import { PopularPosts } from "./popular-posts";
import { QuickTopics } from "./quick-topics";

/**
 * Shared right-side rail for public listing/article pages: a sticky column with
 * an ad slot, a "similar / popular" posts module, quick topics, and a second ad.
 * Each module hides itself when it has nothing to show.
 *
 * Pass `similar` (e.g. a post's related articles) to show a "Similar Reads"
 * module; otherwise the rail falls back to the site's most-popular posts.
 */
export async function PublicRail({
  similar,
  similarTitle = "Similar Reads",
}: {
  similar?: PopularPost[];
  similarTitle?: string;
}) {
  const posts = similar && similar.length > 0 ? similar : await listPopularPosts();
  const title = similar && similar.length > 0 ? similarTitle : "Popular Posts";

  return (
    <aside className="grid content-start gap-4 lg:sticky lg:top-[88px]">
      <AdSlot label="Advertisement" height={250} />
      <PopularPosts posts={posts} title={title} />
      <QuickTopics topics={quickTopics} dense />
      <AdSlot label="Sponsored" height={300} />
    </aside>
  );
}

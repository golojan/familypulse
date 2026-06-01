import { trendingTopics } from "@/lib/familypulse-data";
import { websiteJsonLd } from "@/lib/seo";
import {
  listFeaturedPosts,
  listPopularPosts,
  listTopicSectionsForLanding,
  listVideoPosts,
} from "@/lib/topics-data";
import { CategoryBlogSections } from "@/components/category-blog-sections";
import { JsonLd } from "@/components/json-ld";
import { FeaturedArticles } from "@/components/featured-articles";
import { HeroSliderCard } from "@/components/hero-slider-card";
import { MediaGrid } from "@/components/media-grid";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PopularPosts } from "@/components/popular-posts";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrendingTopics } from "@/components/trending-topics";

export const dynamic = "force-dynamic";

export default async function FamilyPulseLanding() {
  const [topicSections, articles, mediaCards, popularPosts] = await Promise.all([
    listTopicSectionsForLanding(),
    listFeaturedPosts(),
    listVideoPosts(),
    listPopularPosts(),
  ]);

  return (
    <main className="min-h-screen bg-background pb-24 font-sans text-fp-ink lg:pb-0">
      <JsonLd data={websiteJsonLd()} />
      <SiteHeader />

      <div className="mx-auto max-w-[1720px] px-4 py-4 sm:px-8 lg:py-5">
        <div className="min-w-0">
          <HeroSliderCard />

          <section id="articles" className="mt-4">
            <FeaturedArticles articles={articles} />
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
            <MediaGrid cards={mediaCards} />

            <aside className="grid gap-4 lg:grid-cols-1">
              <PopularPosts posts={popularPosts} />
            </aside>
          </section>

          <TrendingTopics topics={trendingTopics} />

          <CategoryBlogSections sections={topicSections} />
        </div>
      </div>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}

import { articles, mediaCards, podcasts, popularPosts, quickTopics, topicBlogSections, trendingTopics } from "@/lib/familypulse-data";
import { CategoryBlogSections } from "@/components/category-blog-sections";
import { FeaturedArticles } from "@/components/featured-articles";
import { HeroSliderCard } from "@/components/hero-slider-card";
import { MediaGrid } from "@/components/media-grid";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NewsletterCard } from "@/components/newsletter-card";
import { PodcastCTA } from "@/components/podcast-cta";
import { PodcastEpisodeList } from "@/components/podcast-episode-list";
import { PodcastHighlights } from "@/components/podcast-highlights";
import { PodcastPromo } from "@/components/podcast-promo";
import { PopularPosts } from "@/components/popular-posts";
import { QuickTopics } from "@/components/quick-topics";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrendingTopics } from "@/components/trending-topics";

export default function FamilyPulseLanding() {
  return (
    <main className="min-h-screen bg-background pb-24 font-sans text-fp-ink lg:pb-0">
      <SiteHeader />

      <div className="mx-auto grid max-w-[1720px] gap-4 px-4 py-4 sm:px-8 lg:py-5 2xl:grid-cols-[minmax(0,1fr)_540px]">
        <div className="min-w-0">
          <HeroSliderCard />

          <section id="articles" className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.92fr]">
            <FeaturedArticles articles={articles} />
            <PodcastEpisodeList episodes={podcasts} />
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.18fr_0.82fr] 2xl:grid-cols-1">
            <MediaGrid cards={mediaCards} />

            <aside className="grid gap-4 lg:grid-cols-1 2xl:hidden">
              <QuickTopics topics={quickTopics} />
              <PodcastHighlights episodes={podcasts} />
            </aside>
          </section>

          <TrendingTopics topics={trendingTopics} />

          <CategoryBlogSections sections={topicBlogSections} />

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <PodcastCTA />
            <NewsletterCard />
          </section>
        </div>

        <aside className="hidden self-start 2xl:grid 2xl:grid-cols-2 gap-4">
          <div className="row-span-2">
            <PopularPosts posts={popularPosts} />
          </div>
          <QuickTopics topics={quickTopics} dense />
          <PodcastPromo />
          <PodcastHighlights episodes={podcasts} />
        </aside>
      </div>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}

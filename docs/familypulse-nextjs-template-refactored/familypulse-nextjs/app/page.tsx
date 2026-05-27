import { articles, mediaCards, podcasts, quickTopics, trendingTopics } from "@/lib/familypulse-data";
import { FeaturedArticles } from "@/components/featured-articles";
import { HeroSliderCard } from "@/components/hero-slider-card";
import { MediaGrid } from "@/components/media-grid";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NewsletterCard } from "@/components/newsletter-card";
import { PodcastCTA } from "@/components/podcast-cta";
import { PodcastEpisodeList } from "@/components/podcast-episode-list";
import { PodcastHighlights } from "@/components/podcast-highlights";
import { QuickTopics } from "@/components/quick-topics";
import { SiteHeader } from "@/components/site-header";
import { TrendingTopics } from "@/components/trending-topics";

export default function FamilyPulseLanding() {
  return (
    <main className="min-h-screen bg-fp-page pb-24 text-fp-ink lg:pb-0">
      <SiteHeader />

      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-8 lg:py-7">
        <HeroSliderCard />

        <section id="articles" className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
          <FeaturedArticles articles={articles} />
          <PodcastEpisodeList episodes={podcasts} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.62fr]">
          <MediaGrid cards={mediaCards} />

          <aside className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
            <QuickTopics topics={quickTopics} />
            <PodcastHighlights episodes={podcasts} />
          </aside>
        </section>

        <TrendingTopics topics={trendingTopics} />

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <PodcastCTA />
          <NewsletterCard />
        </section>
      </div>

      <MobileBottomNav />
    </main>
  );
}

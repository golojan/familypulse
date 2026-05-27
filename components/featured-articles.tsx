import type { Article } from "@/lib/familypulse-data";
import { ArticleCard } from "./article-card";
import { SectionHeader } from "./section-header";

export function FeaturedArticles({ articles }: { articles: Article[] }) {
  return (
    <div className="rounded-lg border border-fp-line bg-white p-4 shadow-card sm:p-5">
      <SectionHeader title="Featured Articles" />
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible">
        {articles.map((article) => (
          <ArticleCard key={article.title} article={article} />
        ))}
      </div>
    </div>
  );
}

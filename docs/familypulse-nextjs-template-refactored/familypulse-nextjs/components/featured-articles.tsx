import type { Article } from "@/lib/familypulse-data";
import { ArticleCard } from "./article-card";
import { SectionHeader } from "./section-header";

export function FeaturedArticles({ articles }: { articles: Article[] }) {
  return (
    <div className="rounded-[1.7rem] border border-fp-line bg-white p-4 shadow-card sm:p-5">
      <SectionHeader title="Featured Articles" />
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible">
        {articles.map((article) => (
          <ArticleCard key={article.title} article={article} />
        ))}
      </div>
    </div>
  );
}

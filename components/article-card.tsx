import Image from "next/image";
import { Clock3 } from "lucide-react";
import { getArticleHref, type Article } from "@/lib/familypulse-data";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <a href={getArticleHref(article)} className="group block min-w-[245px] overflow-hidden rounded-md border border-fp-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-w-0">
      <div className="relative h-36 overflow-hidden sm:h-40 lg:h-44">
        <Image src={article.image} alt={article.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 640px) 245px, (max-width: 1536px) 28vw, 14vw" />
        <span className="absolute bottom-3 left-3 rounded-full bg-fp-green px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-green">
          {article.tag}
        </span>
      </div>
      <div className="space-y-4 p-4">
        <h3 className="min-h-[3.1rem] text-[1.05rem] font-extrabold leading-tight text-fp-ink sm:text-lg">
          {article.title}
        </h3>
        <div className="flex items-center justify-between text-xs font-semibold text-fp-muted">
          <span>{article.meta}</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5 text-fp-green" /> {article.read}
          </span>
        </div>
      </div>
    </a>
  );
}

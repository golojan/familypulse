import type { MediaCard } from "@/lib/familypulse-data";
import { NewsCard } from "./news-card";

export function MediaGrid({ cards }: { cards: MediaCard[] }) {
  return (
    <div id="videos" className="no-scrollbar flex gap-4 overflow-x-auto sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 2xl:grid-cols-5">
      {cards.map((card) => (
        <NewsCard key={card.label} card={card} />
      ))}
    </div>
  );
}

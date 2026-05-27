import type { MediaCard } from "@/lib/familypulse-data";
import { NewsCard } from "./news-card";

export function MediaGrid({ cards }: { cards: MediaCard[] }) {
  return (
    <div id="videos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <NewsCard key={card.label} card={card} />
      ))}
    </div>
  );
}

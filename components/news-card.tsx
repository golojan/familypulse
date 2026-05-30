import Image from "next/image";
import type { MediaCard } from "@/lib/familypulse-data";

export function NewsCard({ card }: { card: MediaCard }) {
  const Icon = card.icon;

  return (
    <article
      data-clickable="true"
      className="min-w-[155px] overflow-hidden rounded-md border border-fp-line bg-white p-3 shadow-card sm:min-w-0"
    >
      <div className="relative h-28 overflow-hidden rounded-sm sm:h-36">
        <Image
          src={card.image}
          alt={card.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 155px, 33vw"
        />
        <button className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-fp-green shadow-md sm:h-12 sm:w-12">
          <Icon className="h-5 w-5" />
        </button>
      </div>
      <div className="pt-3 sm:pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-extrabold text-fp-ink">{card.label}</p>
          <a href={card.href ?? "#"} className="shrink-0 text-xs font-extrabold text-fp-green">
            View all
          </a>
        </div>
        <h3 className="line-clamp-2 text-sm font-extrabold leading-tight text-fp-ink sm:text-base">
          {card.title}
        </h3>
        <p className="mt-3 text-xs font-semibold text-fp-muted">Apr 28, 2024 &middot; 6 min read</p>
      </div>
    </article>
  );
}

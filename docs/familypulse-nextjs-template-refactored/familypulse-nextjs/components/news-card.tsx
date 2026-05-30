import Image from "next/image";
import type { MediaCard } from "@/lib/familypulse-data";

export function NewsCard({ card }: { card: MediaCard }) {
  const Icon = card.icon;

  return (
    <article className="overflow-hidden rounded-[1.45rem] border border-fp-line bg-white p-3 shadow-card">
      <div className="relative h-36 overflow-hidden rounded-[1.15rem]">
        <Image src={card.image} alt={card.title} fill className="object-cover" />
        <button className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-fp-green shadow-md">
          <Icon className="h-5 w-5" />
        </button>
      </div>
      <div className="pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-black text-fp-ink">{card.label}</p>
          <a href="#" className="text-xs font-black text-fp-green">
            View all
          </a>
        </div>
        <h3 className="text-base font-black leading-tight text-fp-ink">{card.title}</h3>
        <p className="mt-3 text-xs font-semibold text-fp-muted">Apr 28, 2024 · 6 min read</p>
      </div>
    </article>
  );
}

import { Play } from "lucide-react";
import type { PodcastEpisode } from "@/lib/familypulse-data";
import { SectionHeader } from "./section-header";

export function PodcastHighlights({ episodes }: { episodes: PodcastEpisode[] }) {
  return (
    <div className="rounded-[1.7rem] border border-fp-line bg-white p-5 shadow-card">
      <SectionHeader title="Podcast Highlights" compact />
      <div className="space-y-3">
        {episodes.map((podcast) => (
          <a
            key={podcast.title}
            href="#"
            className="flex items-center gap-3 rounded-2xl border border-fp-line p-3"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-fp-mint text-fp-green">
              <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-black text-fp-ink">
              {podcast.title}
            </span>
            <span className="rounded-full bg-fp-mint px-2.5 py-1 text-xs font-black text-fp-green">
              {podcast.time}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

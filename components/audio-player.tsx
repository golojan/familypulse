import { Play } from "lucide-react";
import type { PodcastEpisode } from "@/lib/familypulse-data";

type AudioPlayerProps = {
  episode: PodcastEpisode;
  index?: number;
};

export function AudioPlayer({ episode, index = 0 }: AudioPlayerProps) {
  return (
    <div data-clickable="true" className="grid grid-cols-[78px_1fr_auto] items-center gap-3 border-b border-fp-line px-3 py-3 last:border-0 sm:grid-cols-[96px_1fr_auto] sm:px-4">
      <div className="relative grid h-[66px] place-items-center overflow-hidden rounded-md bg-[radial-gradient(circle_at_25%_20%,#6f9f4f,transparent_35%),linear-gradient(135deg,#0e5b20,#063a15)] text-white shadow-green">
        <span className="absolute left-2 top-2 text-[11px] font-extrabold leading-[0.9]">
          Family<br />Pulse
        </span>
        <span className="absolute bottom-2 left-2 text-[7px] font-bold uppercase tracking-widest opacity-70">Podcast</span>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-white text-fp-green shadow-md">
          <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
        </button>
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-extrabold text-fp-ink sm:text-base">{episode.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-fp-muted sm:text-sm">{episode.desc}</p>
        <div className="mt-2 hidden h-3 items-center gap-[3px] sm:flex">
          {Array.from({ length: 32 }).map((_, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full bg-fp-green/25"
              style={{ height: `${5 + ((i * (index + 3)) % 10)}px` }}
            />
          ))}
        </div>
      </div>
      <span className="rounded-full bg-fp-mint px-2.5 py-1 text-xs font-extrabold text-fp-green sm:text-sm">{episode.time}</span>
    </div>
  );
}

import { Headphones, Play } from "lucide-react";

export function PodcastPromo() {
  return (
    <section className="overflow-hidden rounded-lg bg-[radial-gradient(circle_at_84%_18%,rgba(126,188,98,.4),transparent_28%),linear-gradient(135deg,#063a15,#0f6d29)] p-5 text-white shadow-green">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-md border border-white/20 bg-white/10">
          <Headphones className="h-7 w-7" />
        </span>
        <div>
          <h2 className="text-lg font-bold">FamilyPulse Podcast</h2>
          <p className="text-sm font-semibold text-white/80">New episodes weekly!</p>
        </div>
      </div>
      <div className="my-5 flex h-9 items-center gap-[3px] opacity-45">
        {Array.from({ length: 52 }).map((_, i) => (
          <span key={i} className="w-[2px] rounded-full bg-white" style={{ height: `${7 + ((i * 7) % 25)}px` }} />
        ))}
      </div>
      <a className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-extrabold text-fp-green" href="#podcast">
        <Play className="h-4 w-4" fill="currentColor" /> Listen Now
      </a>
    </section>
  );
}

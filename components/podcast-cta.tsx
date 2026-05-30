import { ChevronRight, Headphones } from "lucide-react";

export function PodcastCTA() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-[radial-gradient(circle_at_80%_25%,rgba(126,188,98,.38),transparent_28%),linear-gradient(135deg,#063a15,#0e6b28)] p-5 text-white shadow-green sm:p-8">
      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-md border border-white/20 bg-white/10">
            <Headphones className="h-9 w-9" />
          </span>
          <div>
            <h2 className="text-2xl font-bold">FamilyPulse Podcast</h2>
            <p className="mt-1 text-lg font-semibold text-white/85">New episodes weekly!</p>
          </div>
        </div>
        <a
          className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-extrabold text-fp-ink"
          href="#"
        >
          <Headphones className="h-5 w-5 text-fp-green" /> Listen Now{" "}
          <ChevronRight className="h-5 w-5" />
        </a>
      </div>
      <div className="mt-8 flex h-10 items-center gap-[4px] opacity-45">
        {Array.from({ length: 88 }).map((_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-white"
            style={{ height: `${8 + ((i * 7) % 32)}px` }}
          />
        ))}
      </div>
    </div>
  );
}

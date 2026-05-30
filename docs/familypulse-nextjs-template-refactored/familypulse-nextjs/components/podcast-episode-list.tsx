import type { PodcastEpisode } from "@/lib/familypulse-data";
import { AudioPlayer } from "./audio-player";
import { SectionHeader } from "./section-header";

type PodcastEpisodeListProps = {
  episodes: PodcastEpisode[];
};

export function PodcastEpisodeList({ episodes }: PodcastEpisodeListProps) {
  return (
    <div
      id="podcast"
      className="rounded-[1.7rem] border border-fp-line bg-white p-4 shadow-card sm:p-5"
    >
      <SectionHeader title="Latest Podcast Episodes" />
      <div className="overflow-hidden rounded-[1.35rem] border border-fp-line bg-white">
        {episodes.map((episode, index) => (
          <AudioPlayer key={episode.title} episode={episode} index={index} />
        ))}
      </div>
    </div>
  );
}

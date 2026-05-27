import Image from "next/image";
import { Play } from "lucide-react";

type VideoCardProps = {
  title: string;
  image: string;
  duration?: string;
};

export function VideoCard({ title, image, duration = "10:36" }: VideoCardProps) {
  return (
    <article className="overflow-hidden rounded-[1.45rem] border border-fp-line bg-white p-3 shadow-card">
      <div className="relative h-36 overflow-hidden rounded-[1.15rem]">
        <Image src={image} alt={title} fill className="object-cover" />
        <button className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-fp-green shadow-md">
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
        </button>
        <span className="absolute bottom-2 right-2 rounded-full bg-fp-ink/80 px-2.5 py-1 text-[10px] font-black text-white">
          {duration}
        </span>
      </div>
      <div className="pt-4">
        <p className="mb-2 text-sm font-black text-fp-ink">Videos</p>
        <h3 className="text-base font-black leading-tight text-fp-ink">{title}</h3>
        <a href="#" className="mt-3 inline-flex text-xs font-black text-fp-green">View all</a>
      </div>
    </article>
  );
}

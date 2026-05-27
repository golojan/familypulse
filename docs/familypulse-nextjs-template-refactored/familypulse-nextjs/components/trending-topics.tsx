import { TrendingUp } from "lucide-react";

export function TrendingTopics({ topics }: { topics: string[] }) {
  return (
    <section className="mt-5 overflow-hidden rounded-[1.7rem] border border-fp-line bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-fp-mint text-fp-green">
            <TrendingUp className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-black tracking-[-0.035em]">Trending Topics</h2>
        </div>
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto lg:flex-wrap lg:justify-end">
          {topics.map((tag) => (
            <a key={tag} className="whitespace-nowrap rounded-full border border-fp-green/15 bg-fp-mint px-4 py-2 text-xs font-black text-fp-green" href="#">
              {tag}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

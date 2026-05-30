import { TrendingUp } from "lucide-react";

type TrendingTopic = {
  title: string;
  href: string;
};

export function TrendingTopics({ topics }: { topics: TrendingTopic[] }) {
  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-fp-line bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-md bg-fp-mint text-fp-green">
            <TrendingUp className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-bold text-fp-ink">Trending Topics</h2>
        </div>
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto lg:flex-wrap lg:justify-end">
          {topics.map((topic) => (
            <a
              key={topic.title}
              className="whitespace-nowrap rounded-full border border-fp-green/15 bg-fp-mint px-4 py-2 text-xs font-extrabold text-fp-green"
              href={topic.href}
            >
              {topic.title}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

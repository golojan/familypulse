import { ChevronRight } from "lucide-react";
import type { QuickTopic } from "@/lib/familypulse-data";
import { SectionHeader } from "./section-header";

export function QuickTopics({ topics }: { topics: QuickTopic[] }) {
  return (
    <div className="rounded-[1.7rem] border border-fp-line bg-fp-soft p-5 shadow-card">
      <SectionHeader title="Quick Topics" compact />
      <div className="space-y-2">
        {topics.map(({ icon: TopicIcon, title, desc }) => (
          <a key={title} href="#" className="flex items-center gap-3 rounded-2xl bg-white p-3 transition hover:shadow-soft">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-fp-mint text-fp-green">
              <TopicIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-fp-ink">{title}</span>
              <span className="block truncate text-xs font-semibold text-fp-muted">{desc}</span>
            </span>
            <ChevronRight className="ml-auto h-5 w-5 text-fp-green" />
          </a>
        ))}
      </div>
    </div>
  );
}

import { ChevronRight } from "lucide-react";
import type { QuickTopic } from "@/lib/familypulse-data";
import { SectionHeader } from "./section-header";

export function QuickTopics({ topics, dense = false }: { topics: QuickTopic[]; dense?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-fp-line bg-fp-soft shadow-card ${dense ? "p-4" : "p-5"}`}
    >
      <SectionHeader title="Quick Topics" compact />
      <div className={dense ? "space-y-1" : "space-y-2"}>
        {topics.map(({ icon: TopicIcon, title, desc, href }) => (
          <a
            key={title}
            href={href}
            className={`flex items-center gap-3 rounded-md bg-white transition hover:shadow-soft ${dense ? "p-2" : "p-3"}`}
          >
            <span
              className={`grid place-items-center rounded-full bg-fp-mint text-fp-green ${dense ? "h-9 w-9" : "h-11 w-11"}`}
            >
              <TopicIcon className={dense ? "h-4 w-4" : "h-5 w-5"} />
            </span>
            <span className="min-w-0">
              <span className={`${dense ? "text-xs" : "text-sm"} block font-extrabold text-fp-ink`}>
                {title}
              </span>
              <span className="block truncate text-xs font-semibold text-fp-muted">{desc}</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-fp-green" />
          </a>
        ))}
      </div>
    </div>
  );
}

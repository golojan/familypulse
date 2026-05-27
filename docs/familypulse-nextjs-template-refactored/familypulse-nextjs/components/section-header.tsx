import { ChevronRight } from "lucide-react";

type SectionHeaderProps = {
  title: string;
  compact?: boolean;
  href?: string;
};

export function SectionHeader({ title, compact = false, href = "#" }: SectionHeaderProps) {
  return (
    <div className={`mb-3 flex items-center justify-between ${compact ? "px-1" : ""}`}>
      <h2 className="text-xl font-black tracking-[-0.035em] text-fp-ink sm:text-2xl">{title}</h2>
      <a className="inline-flex items-center gap-1 text-sm font-extrabold text-fp-green" href={href}>
        View all <ChevronRight className="h-4 w-4" />
      </a>
    </div>
  );
}

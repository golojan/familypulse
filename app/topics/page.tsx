import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { listTopicsWithCounts } from "@/lib/topics-data";
import { PublicShell } from "@/components/public-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Browse topics",
  description:
    "Browse FamilyPulse by topic — parenting, relationships, child development, wellbeing, and more. Evidence-based family guidance grouped by what matters most.",
  path: "/topics",
});

export default async function TopicsPage() {
  const topics = await listTopicsWithCounts();

  return (
    <PublicShell>
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-extrabold uppercase text-fp-green">Topics</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-fp-ink">
            Browse FamilyPulse by topic
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-fp-muted">
            Find articles grouped around the family conversations, parenting needs, and relationship
            questions that matter most.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map(({ icon: TopicIcon, title, desc, href, slug, postCount }) => (
            <Link
              key={slug}
              className="group rounded-lg border border-fp-line bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-xl"
              href={href}
            >
              <span className="grid h-12 w-12 place-items-center rounded-md bg-fp-mint text-fp-green">
                <TopicIcon className="h-6 w-6" />
              </span>
              <span className="mt-5 block text-xl font-bold text-fp-ink">{title}</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-fp-muted">
                {desc}
              </span>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-fp-green">
                {postCount} posts
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}

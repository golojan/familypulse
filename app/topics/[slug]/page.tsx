import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { getArticleHref } from "@/lib/familypulse-data";
import { buildMetadata } from "@/lib/seo";
import { getTopicMeta, getTopicPageData } from "@/lib/topics-data";
import { PublicRail } from "@/components/public-rail";
import { PublicShell } from "@/components/public-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getTopicMeta(slug);
  if (!meta) {
    return buildMetadata({ title: "Topic not found", path: `/topics/${slug}`, noindex: true });
  }
  return buildMetadata({
    title: `${meta.title} — Family guidance`,
    description: meta.description,
    path: `/topics/${slug}`,
  });
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getTopicPageData(slug);

  if (!data) {
    notFound();
  }

  const { topic, posts } = data;
  const [lead, ...rest] = posts;
  const TopicIcon = topic.icon;

  return (
    <PublicShell rail={<PublicRail />}>
      <section className="min-w-0">
        <Link
          className="inline-flex items-center gap-2 text-sm font-extrabold text-fp-green"
          href="/topics"
        >
          <ArrowLeft className="h-4 w-4" />
          All topics
        </Link>

        <div className="mt-6 rounded-lg border border-fp-line bg-white p-5 shadow-card sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase text-fp-green">Topic</p>
              <h1 className="mt-2 text-4xl font-bold leading-tight text-fp-ink">{topic.title}</h1>
              <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-fp-muted">
                {topic.desc}
              </p>
            </div>
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-md bg-fp-mint text-fp-green">
              <TopicIcon className="h-8 w-8" />
            </span>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-fp-line bg-white p-10 text-center shadow-card">
            <p className="text-base font-semibold text-fp-muted">
              No posts in this topic yet. Check back soon.
            </p>
          </div>
        ) : null}

        {lead ? (
          <Link
            className="group mt-5 grid overflow-hidden rounded-lg border border-fp-line bg-fp-ink shadow-card lg:grid-cols-[1.05fr_0.95fr]"
            href={getArticleHref(lead)}
          >
            <span className="relative min-h-[18rem] lg:min-h-[28rem]">
              <Image
                src={lead.image}
                alt={lead.title}
                fill
                className="object-cover opacity-85 transition duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </span>
            <span className="flex flex-col justify-end p-5 text-white sm:p-8">
              <span className="w-fit rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase text-fp-green">
                {lead.tag}
              </span>
              <span className="mt-5 block text-3xl font-bold leading-tight sm:text-4xl">
                {lead.title}
              </span>
              <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/80">
                {lead.meta}
                <span>&middot;</span>
                <Clock3 className="h-4 w-4" />
                {lead.read}
              </span>
            </span>
          </Link>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              className="overflow-hidden rounded-lg border border-fp-line bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl"
              href={getArticleHref(post)}
            >
              <span className="relative block h-44">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </span>
              <span className="block p-4">
                <span className="text-xs font-extrabold uppercase text-fp-green">{post.tag}</span>
                <span className="mt-2 line-clamp-2 block text-lg font-bold leading-tight text-fp-ink">
                  {post.title}
                </span>
                <span className="mt-4 flex items-center gap-2 text-xs font-semibold text-fp-muted">
                  {post.meta}
                  <span>&middot;</span>
                  {post.read}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}

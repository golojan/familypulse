import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { getArticleHref } from "@/lib/familypulse-data";
import { type Block } from "@/lib/posts";
import { getPostPageData } from "@/lib/topics-data";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPostPageData(slug);

  if (!data) {
    notFound();
  }

  const { post, relatedPosts } = data;

  return (
    <main className="min-h-screen bg-background px-4 py-8 font-sans text-fp-ink sm:px-8">
      <article className="mx-auto max-w-[980px]">
        <Link
          className="inline-flex items-center gap-2 text-sm font-extrabold text-fp-green"
          href={post.topicHref ?? "/topics"}
        >
          <ArrowLeft className="h-4 w-4" />
          {post.topicTitle ?? "Back to topics"}
        </Link>

        <header className="mt-6">
          <Link
            className="inline-flex rounded-full bg-fp-mint px-3 py-1 text-xs font-extrabold uppercase text-fp-green"
            href={post.topicHref ?? "/topics"}
          >
            {post.topicTitle ?? post.tag}
          </Link>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-fp-ink sm:text-5xl">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-fp-muted">
            <span>{post.meta}</span>
            <span>&middot;</span>
            <Clock3 className="h-4 w-4 text-fp-green" />
            <span>{post.read}</span>
          </div>
        </header>

        <div className="relative mt-8 min-h-[22rem] overflow-hidden rounded-lg shadow-card sm:min-h-[34rem]">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 980px"
            priority
          />
        </div>

        {post.type === "VIDEO" && post.videoUrl ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-fp-line bg-white p-3 shadow-card">
            {isYouTubeUrl(post.videoUrl) ? (
              <iframe
                className="aspect-video w-full rounded-md"
                src={toYouTubeEmbed(post.videoUrl)}
                title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video className="w-full rounded-md" src={post.videoUrl} controls />
            )}
          </div>
        ) : null}

        {post.type === "PODCAST" && post.audioUrl ? (
          <div className="mt-6 rounded-lg border border-fp-line bg-white p-5 shadow-card">
            <audio className="w-full" src={post.audioUrl} controls />
          </div>
        ) : null}

        <PostBody
          blocks={post.blocks}
          excerpt={post.excerpt}
          topicName={post.topicTitle ?? post.tag}
        />
      </article>

      {relatedPosts.length > 0 ? (
        <section className="mx-auto mt-8 max-w-[980px]">
          <h2 className="text-2xl font-bold text-fp-ink">Related in {post.topicTitle}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                className="rounded-lg border border-fp-line bg-white p-4 shadow-card transition hover:-translate-y-1 hover:shadow-xl"
                href={getArticleHref(related)}
              >
                <span className="text-xs font-extrabold uppercase text-fp-green">
                  {related.tag}
                </span>
                <span className="mt-2 line-clamp-2 block text-base font-bold leading-tight text-fp-ink">
                  {related.title}
                </span>
                <span className="mt-3 block text-xs font-semibold text-fp-muted">
                  {related.read}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function isYouTubeUrl(url: string) {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

function toYouTubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    const videoId = parsed.hostname.includes("youtu.be")
      ? parsed.pathname.replace("/", "")
      : parsed.searchParams.get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
}

function PostBody({
  blocks,
  excerpt,
  topicName,
}: {
  blocks?: Block[];
  excerpt?: string | null;
  topicName: string;
}) {
  if (!blocks?.length) {
    return (
      <div className="mt-8 rounded-lg border border-fp-line bg-white p-5 text-base font-semibold leading-8 text-fp-muted shadow-card sm:p-8">
        <p>
          {excerpt ||
            `This FamilyPulse article belongs to the ${topicName} topic. It is part of a grouped reading path, so readers can move from this post into related guidance without searching manually.`}
        </p>
        <p className="mt-5">
          Use the related posts below to continue through the same topic, or return to the topic
          page to view the full collection.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-fp-line bg-white p-5 text-base font-semibold leading-8 text-fp-muted shadow-card sm:p-8">
      {blocks.map((block) => {
        if (block.type === "heading") {
          const HeadingTag = block.level === 3 ? "h3" : "h2";
          return (
            <HeadingTag
              key={block.id}
              className="mt-7 first:mt-0 text-2xl font-bold leading-tight text-fp-ink"
            >
              {block.text}
            </HeadingTag>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={block.id} className="mt-5 first:mt-0">
              {block.text}
            </p>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote
              key={block.id}
              className="mt-6 border-l-4 border-fp-green bg-fp-mint/40 px-5 py-4 text-lg font-bold leading-8 text-fp-ink"
            >
              {block.text}
              {block.cite ? (
                <cite className="mt-3 block text-sm font-semibold text-fp-muted">
                  - {block.cite}
                </cite>
              ) : null}
            </blockquote>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={block.id}
              className={`mt-5 space-y-2 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <figure key={block.id} className="mt-7">
            <div className="relative min-h-[18rem] overflow-hidden rounded-md">
              <Image
                src={block.url}
                alt={block.alt ?? ""}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 820px"
              />
            </div>
            {block.caption ? (
              <figcaption className="mt-2 text-sm font-semibold text-fp-muted">
                {block.caption}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}

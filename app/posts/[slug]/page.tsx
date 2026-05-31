import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getArticleHref } from "@/lib/familypulse-data";
import { getSetting } from "@/lib/settings";
import { hasDismissedGate, isSubscribed } from "@/lib/subscription";
import { getPostPageData } from "@/lib/topics-data";
import { isYouTubeUrl, youTubeEmbedUrl, youTubeId } from "@/lib/video";
import { PostBody, type PostGateInfo } from "@/components/post-body";
import { PublicRail } from "@/components/public-rail";
import { PublicShell } from "@/components/public-shell";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPostPageData(slug);

  if (!data) {
    notFound();
  }

  const { post, relatedPosts } = data;
  const adsenseClientId = await getSetting("ADSENSE_CLIENT_ID");

  // Metered paywall: gate article bodies for readers who haven't subscribed and
  // haven't chosen "subscribe later" on this post. Video/podcast posts (player
  // based) are never gated. Subscription is global and tied to a signed-in user.
  const session = await auth();
  const isArticle = post.type === "ARTICLE";
  let gate: PostGateInfo | null = null;
  if (isArticle && post.id) {
    const [subscribed, dismissed] = await Promise.all([isSubscribed(), hasDismissedGate(post.id)]);
    if (!subscribed && !dismissed) {
      gate = { postId: post.id, postSlug: slug, isAuthenticated: Boolean(session?.user?.id) };
    }
  }

  const similar = relatedPosts.map((related) => ({
    title: related.title,
    image: related.image,
    meta: related.meta,
    read: related.read,
    href: related.href,
  }));

  return (
    <PublicShell
      rail={
        <PublicRail
          similar={similar}
          similarTitle={`More in ${post.topicTitle ?? "Family Life"}`}
        />
      }
    >
      <article className="min-w-0">
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

        {/* Video and Podcast posts both display a video player. */}
        {(post.type === "VIDEO" || post.type === "PODCAST") && post.videoUrl ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-fp-line bg-white p-3 shadow-card">
            {isYouTubeUrl(post.videoUrl) && youTubeId(post.videoUrl) ? (
              <iframe
                className="aspect-video w-full rounded-md"
                src={youTubeEmbedUrl(youTubeId(post.videoUrl) as string)}
                title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video className="aspect-video w-full rounded-md" src={post.videoUrl} controls />
            )}
          </div>
        ) : null}

        <PostBody
          blocks={post.blocks}
          excerpt={post.excerpt}
          topicName={post.topicTitle ?? post.tag}
          adsenseClientId={adsenseClientId}
          gate={gate}
        />
      </article>

      {relatedPosts.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-fp-ink">Related in {post.topicTitle}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
    </PublicShell>
  );
}

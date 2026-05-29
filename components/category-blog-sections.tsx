import Image from "next/image";
import { ArrowRight, Clock3 } from "lucide-react";
import { getArticleHref, type Article, type TopicBlogSection } from "@/lib/familypulse-data";
import { SectionHeader } from "./section-header";

type CategoryBlogSectionsProps = {
  sections: TopicBlogSection[];
};

export function CategoryBlogSections({ sections }: CategoryBlogSectionsProps) {
  const visibleSections = sections.filter(
    (section) => section?.title && section?.href && section.posts?.length,
  );

  return (
    <section className="mt-4 grid gap-4">
      {visibleSections.map((section, index) => (
        <TopicModule key={section.title} section={section} variant={index % 4} />
      ))}
    </section>
  );
}

function TopicModule({ section, variant }: { section: TopicBlogSection; variant: number }) {
  const posts = section.posts.filter(Boolean);
  const layout = posts.length < 3 ? 0 : variant;

  if (posts.length === 0) {
    return null;
  }

  return (
    <section id={section.slug} className="rounded-lg border border-fp-line bg-white p-4 shadow-card sm:p-5">
      <SectionHeader title={section.title} href={section.href} />
      {layout === 0 ? <HeroAndList posts={posts} /> : null}
      {layout === 1 ? <MosaicGrid posts={posts} /> : null}
      {layout === 2 ? <ListLedLayout posts={posts} /> : null}
      {layout === 3 ? <WideRowLayout posts={posts} /> : null}
    </section>
  );
}

function HeroAndList({ posts }: { posts: Article[] }) {
  const [lead] = posts;
  const sidePosts = posts.slice(1, 4);
  const morePosts = posts.slice(4);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
        <OverlayPost post={lead} className="min-h-[21rem]" />
        <div className="grid gap-3">
          {sidePosts.map((post) => (
            <CompactRow key={post.title} post={post} />
          ))}
        </div>
      </div>
      <MorePostGrid posts={morePosts} />
    </div>
  );
}

function MosaicGrid({ posts }: { posts: Article[] }) {
  const [lead, second, third] = posts;
  const morePosts = posts.slice(3);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-md border border-fp-line bg-fp-soft p-4">
          <p className="text-xs font-extrabold uppercase text-fp-green">Editor pick</p>
          <h3 className="mt-3 text-2xl font-bold leading-tight text-fp-ink">{lead.title}</h3>
          <PostMeta post={lead} className="mt-5" />
          <a className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-fp-green" href={getArticleHref(lead)}>
            Read the story <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {second ? <OverlayPost post={second} className="min-h-[16rem]" /> : null}
          {third ? <OverlayPost post={third} className="min-h-[16rem]" /> : null}
        </div>
      </div>
      <MorePostGrid posts={morePosts} />
    </div>
  );
}

function ListLedLayout({ posts }: { posts: Article[] }) {
  const [lead, ...rest] = posts;
  const listPosts = rest.slice(0, 4);
  const morePosts = rest.slice(4);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="divide-y divide-fp-line rounded-md border border-fp-line bg-white">
        {listPosts.map((post, index) => (
          <a key={post.title} href={getArticleHref(post)} className="grid gap-3 p-4 sm:grid-cols-[5.5rem_1fr]">
            <span className="relative hidden h-20 overflow-hidden rounded-sm sm:block">
              <Image src={post.image} alt={post.title} fill className="object-cover" sizes="88px" />
            </span>
            <span className="min-w-0">
              <span className="text-xs font-extrabold uppercase text-fp-green">0{index + 1} / {post.tag}</span>
              <span className="mt-1 block text-base font-extrabold leading-tight text-fp-ink">{post.title}</span>
              <PostMeta post={post} className="mt-2" />
            </span>
          </a>
        ))}
      </div>
      <OverlayPost post={lead} className="min-h-[23rem]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:col-span-2">
        {morePosts.map((post) => (
          <TextStrip key={post.title} post={post} />
        ))}
      </div>
    </div>
  );
}

function WideRowLayout({ posts }: { posts: Article[] }) {
  const [lead, second, third] = posts;
  const morePosts = posts.slice(3);

  return (
    <div className="grid gap-4">
      <a href={getArticleHref(lead)} className="grid overflow-hidden rounded-md border border-fp-line bg-fp-soft lg:grid-cols-[18rem_1fr_auto]">
        <span className="relative min-h-[13rem] lg:min-h-full">
          <Image src={lead.image} alt={lead.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 288px" />
        </span>
        <span className="p-4 sm:p-5">
          <span className="text-xs font-extrabold uppercase text-fp-green">{lead.tag}</span>
          <span className="mt-2 block text-2xl font-bold leading-tight text-fp-ink">{lead.title}</span>
          <PostMeta post={lead} className="mt-4" />
        </span>
        <span className="hidden items-center px-5 text-fp-green lg:flex">
          <ArrowRight className="h-6 w-6" />
        </span>
      </a>
      <div className="grid gap-4 sm:grid-cols-2">
        {second ? <CompactRow post={second} /> : null}
        {third ? <CompactRow post={third} /> : null}
      </div>
      <MorePostGrid posts={morePosts} />
    </div>
  );
}

function OverlayPost({ post, className = "" }: { post: Article; className?: string }) {
  return (
    <a href={getArticleHref(post)} className={`group relative block overflow-hidden rounded-md bg-fp-ink ${className}`}>
      <Image
        src={post.image}
        alt={post.title}
        fill
        className="object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
        sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 36vw"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-fp-ink/90 via-fp-ink/30 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
        <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase text-fp-green">
          {post.tag}
        </span>
        <span className="mt-3 block text-2xl font-bold leading-tight">{post.title}</span>
        <span className="mt-3 flex items-center gap-2 text-xs font-semibold text-white/85">
          {post.meta} <span>&middot;</span> {post.read}
        </span>
      </span>
    </a>
  );
}

function CompactRow({ post }: { post: Article }) {
  return (
    <a href={getArticleHref(post)} className="grid min-h-[9rem] grid-cols-[7rem_1fr] overflow-hidden rounded-md border border-fp-line bg-white transition hover:shadow-soft">
      <span className="relative">
        <Image src={post.image} alt={post.title} fill className="object-cover" sizes="112px" />
      </span>
      <span className="min-w-0 p-3">
        <span className="text-[10px] font-extrabold uppercase text-fp-green">{post.tag}</span>
        <span className="mt-1 line-clamp-2 block text-base font-extrabold leading-tight text-fp-ink">{post.title}</span>
        <PostMeta post={post} className="mt-3" />
      </span>
    </a>
  );
}

function TextStrip({ post }: { post: Article }) {
  return (
    <a href={getArticleHref(post)} className="rounded-md border border-fp-line bg-fp-soft p-4 transition hover:bg-fp-mint/60">
      <span className="text-xs font-extrabold uppercase text-fp-green">{post.tag}</span>
      <span className="mt-2 block text-lg font-extrabold leading-tight text-fp-ink">{post.title}</span>
      <PostMeta post={post} className="mt-3" />
    </a>
  );
}

function MorePostGrid({ posts }: { posts: Article[] }) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 border-t border-fp-line pt-4 sm:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <TextStrip key={post.title} post={post} />
      ))}
    </div>
  );
}

function PostMeta({ post, className = "" }: { post: Article; className?: string }) {
  return (
    <span className={`flex flex-wrap items-center gap-2 text-xs font-semibold text-fp-muted ${className}`}>
      <span>{post.meta}</span>
      <span className="inline-flex items-center gap-1">
        <Clock3 className="h-3.5 w-3.5 text-fp-green" /> {post.read}
      </span>
    </span>
  );
}

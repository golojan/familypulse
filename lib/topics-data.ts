import {
  Brain,
  BriefcaseBusiness,
  Heart,
  Home,
  MessageCircle,
  PartyPopper,
  PlayCircle,
  ShieldCheck,
  Star,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  allPosts as fallbackPosts,
  articles as fallbackArticles,
  getPostBySlug as getFallbackPostBySlug,
  getPostsByTopicSlug as getFallbackPostsByTopicSlug,
  getTopicBySlug as getFallbackTopicBySlug,
  mediaCards as fallbackMediaCards,
  popularPosts as fallbackPopularPosts,
  slugify,
  topicBlogSections as fallbackTopicSections,
  topics as fallbackTopics,
  type Article,
  type MediaCard,
  type PopularPost,
  type Topic,
  type TopicBlogSection,
} from "@/lib/familypulse-data";
import { deriveCover, parseBlocks, type Block } from "@/lib/posts";

const TOPIC_ICON_NAMES: Record<string, string> = {
  communication: "MessageCircle",
  "parenting-discipline": "ShieldCheck",
  "marriage-relationships": "Heart",
  "work-life-balance": "BriefcaseBusiness",
  "child-development": "Star",
  "mental-wellness": "Brain",
  "family-activities": "PartyPopper",
  "faith-values": "Home",
};

const TOPIC_ICONS: Record<string, LucideIcon> = {
  Brain,
  BriefcaseBusiness,
  Heart,
  Home,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Star,
};

type DbTopic = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string;
};

type DbPost = {
  id: string;
  title: string;
  slug: string;
  type: "ARTICLE" | "VIDEO" | "PODCAST";
  excerpt: string | null;
  coverImage: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  blocks: unknown;
  publishedAt: Date | null;
  updatedAt: Date;
  topic: DbTopic | null;
};

export type TopicOption = {
  id: string;
  title: string;
  slug: string;
  parentTitle?: string;
};

export type PostPageData = Article & {
  id?: string;
  blocks?: Block[];
  excerpt?: string | null;
};

function iconFor(name: string): LucideIcon {
  return TOPIC_ICONS[name] ?? MessageCircle;
}

function toTopic(topic: DbTopic): Topic {
  return {
    icon: iconFor(topic.icon),
    title: topic.title,
    desc: topic.description ?? "",
    slug: topic.slug,
    href: `/topics/${topic.slug}`,
  };
}

function formatDate(date: Date | null) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date ?? new Date());
}

function estimateReadTime(blocks: Block[], excerpt: string | null) {
  const text = [
    excerpt,
    ...blocks.flatMap((block) => {
      if (block.type === "heading" || block.type === "paragraph" || block.type === "quote") {
        return block.text;
      }
      if (block.type === "list") {
        return block.items;
      }
      return [];
    }),
  ]
    .filter(Boolean)
    .join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} min read`;
}

function dbPostToArticle(post: DbPost): PostPageData {
  const blocks = parseBlocks(post.blocks);
  const topicTitle = post.topic?.title ?? "Family Life";
  const topicSlug = post.topic?.slug ?? slugify(topicTitle);
  const cover =
    post.coverImage ??
    deriveCover(blocks) ??
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=900&q=80";

  return {
    id: post.id,
    tag: topicTitle,
    title: post.title,
    type: post.type,
    slug: post.slug,
    href: `/posts/${post.slug}`,
    image: cover,
    videoUrl: post.videoUrl,
    audioUrl: post.audioUrl,
    meta: formatDate(post.publishedAt ?? post.updatedAt),
    read: estimateReadTime(blocks, post.excerpt),
    topicTitle,
    topicSlug,
    topicHref: `/topics/${topicSlug}`,
    blocks,
    excerpt: post.excerpt,
  };
}

async function ensureDefaultTopics() {
  await Promise.all(
    fallbackTopics.map((topic) =>
      prisma.topic.upsert({
        where: { slug: topic.slug },
        create: {
          title: topic.title,
          slug: topic.slug,
          description: topic.desc,
          icon: TOPIC_ICON_NAMES[topic.slug] ?? "MessageCircle",
        },
        update: {
          title: topic.title,
          description: topic.desc,
          icon: TOPIC_ICON_NAMES[topic.slug] ?? "MessageCircle",
        },
      }),
    ),
  );
}

function warnTopicStoreFallback(error: unknown) {
  console.warn("Topic store unavailable; using fallback content.", error);
}

function topicOrder(slug: string) {
  const index = fallbackTopics.findIndex((topic) => topic.slug === slug);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export async function listTopicsForEditor(): Promise<TopicOption[]> {
  try {
    await ensureDefaultTopics();
    const topics = await prisma.topic.findMany({
      orderBy: [{ parentId: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        parent: {
          select: { title: true },
        },
      },
    });
    return topics
      .sort((a, b) => topicOrder(a.slug) - topicOrder(b.slug))
      .map((topic) => ({
        id: topic.id,
        title: topic.parent ? `${topic.parent.title} / ${topic.title}` : topic.title,
        slug: topic.slug,
        parentTitle: topic.parent?.title,
      }));
  } catch (error) {
    warnTopicStoreFallback(error);
    return [];
  }
}

export async function listTopicsWithCounts() {
  try {
    await ensureDefaultTopics();
    const topics = await prisma.topic.findMany({
      include: {
        _count: {
          select: {
            posts: { where: { status: "PUBLISHED" } },
          },
        },
      },
    });

    return topics
      .sort((a, b) => topicOrder(a.slug) - topicOrder(b.slug))
      .map((topic) => ({
        ...toTopic(topic),
        postCount: topic._count.posts || getFallbackPostsByTopicSlug(topic.slug).length,
      }));
  } catch (error) {
    warnTopicStoreFallback(error);
    return fallbackTopics.map((topic) => ({
      ...topic,
      postCount: getFallbackPostsByTopicSlug(topic.slug).length,
    }));
  }
}

export async function listTopicSectionsForLanding(limit = 7): Promise<TopicBlogSection[]> {
  try {
    await ensureDefaultTopics();
    const topics = await prisma.topic.findMany({
      where: { parentId: null },
      include: {
        posts: {
          where: { status: "PUBLISHED" },
          orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
          take: limit,
          include: { topic: true },
        },
      },
    });
    const fallbackBySlug = new Map(fallbackTopicSections.map((section) => [section.slug, section]));

    const sections = topics
      .sort((a, b) => topicOrder(a.slug) - topicOrder(b.slug))
      .map((topic) => {
        const posts = topic.posts.map(dbPostToArticle);
        const fallback = fallbackBySlug.get(topic.slug);

        return {
          title: topic.title,
          slug: topic.slug,
          href: `/topics/${topic.slug}`,
          posts: posts.length ? posts : (fallback?.posts ?? []),
        };
      });

    return sections.filter((section) => section.posts.length > 0);
  } catch (error) {
    warnTopicStoreFallback(error);
    return fallbackTopicSections;
  }
}

/** Shared include for pulling published posts with their topic. */
const PUBLISHED_WITH_TOPIC = {
  where: { status: "PUBLISHED" as const },
  orderBy: [{ publishedAt: "desc" as const }, { updatedAt: "desc" as const }],
  include: { topic: true },
};

/**
 * Latest published posts (any type) as Articles, for the homepage "Featured
 * Articles" rail. Falls back to the static set when the store is empty/unavailable.
 */
export async function listFeaturedPosts(limit = 3): Promise<Article[]> {
  try {
    const posts = await prisma.post.findMany({ ...PUBLISHED_WITH_TOPIC, take: limit });
    if (posts.length === 0) return fallbackArticles;
    return posts.map(dbPostToArticle);
  } catch (error) {
    warnTopicStoreFallback(error);
    return fallbackArticles;
  }
}

/**
 * Latest published video/podcast posts as MediaCards, for the homepage "Videos"
 * grid. Falls back to the static set when there are none.
 */
export async function listVideoPosts(limit = 5): Promise<MediaCard[]> {
  try {
    const posts = await prisma.post.findMany({
      ...PUBLISHED_WITH_TOPIC,
      where: { status: "PUBLISHED", type: { in: ["VIDEO", "PODCAST"] } },
      take: limit,
    });
    if (posts.length === 0) return fallbackMediaCards;
    return posts.map((post) => {
      const article = dbPostToArticle(post);
      return {
        label: article.topicTitle ?? "Video",
        title: article.title,
        image: article.image,
        icon: PlayCircle,
        href: article.href,
      } satisfies MediaCard;
    });
  } catch (error) {
    warnTopicStoreFallback(error);
    return fallbackMediaCards;
  }
}

/**
 * Most recent published posts as PopularPosts, for the homepage sidebar. (We
 * don't track views, so "popular" is approximated by recency.) Falls back to
 * the static set when empty.
 */
export async function listPopularPosts(limit = 5): Promise<PopularPost[]> {
  try {
    const posts = await prisma.post.findMany({ ...PUBLISHED_WITH_TOPIC, take: limit });
    if (posts.length === 0) return fallbackPopularPosts;
    return posts.map((post) => {
      const article = dbPostToArticle(post);
      return {
        title: article.title,
        image: article.image,
        meta: article.meta,
        read: article.read,
        href: article.href,
      } satisfies PopularPost;
    });
  } catch (error) {
    warnTopicStoreFallback(error);
    return fallbackPopularPosts;
  }
}

export async function getTopicPageData(slug: string) {
  try {
    await ensureDefaultTopics();
    const topic = await prisma.topic.findUnique({
      where: { slug },
      include: {
        posts: {
          where: { status: "PUBLISHED" },
          orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
          include: { topic: true },
        },
      },
    });

    if (!topic) {
      return null;
    }

    return {
      topic: toTopic(topic),
      posts: topic.posts.length
        ? topic.posts.map(dbPostToArticle)
        : getFallbackPostsByTopicSlug(slug),
    };
  } catch (error) {
    warnTopicStoreFallback(error);
    const topic = getFallbackTopicBySlug(slug);
    if (!topic) return null;
    return { topic, posts: getFallbackPostsByTopicSlug(slug) };
  }
}

type PostPageResult = {
  post: PostPageData;
  relatedPosts: PostPageData[];
};

function fallbackArticleToPostPageData(article: Article): PostPageData {
  return {
    ...article,
    blocks: undefined,
    excerpt: undefined,
  };
}

export async function getPostPageData(slug: string): Promise<PostPageResult | null> {
  let post: (DbPost & { topicId: string | null }) | null = null;

  try {
    post = await prisma.post.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { topic: true },
    });
  } catch (error) {
    warnTopicStoreFallback(error);
  }

  if (!post) {
    const fallbackPost = getFallbackPostBySlug(slug);
    if (!fallbackPost) return null;
    return {
      post: fallbackArticleToPostPageData(fallbackPost),
      relatedPosts: fallbackPost.topicSlug
        ? getFallbackPostsByTopicSlug(fallbackPost.topicSlug)
            .filter((item) => item.slug !== fallbackPost.slug)
            .slice(0, 3)
            .map(fallbackArticleToPostPageData)
        : fallbackPosts
            .filter((item) => item.slug !== fallbackPost.slug)
            .slice(0, 3)
            .map(fallbackArticleToPostPageData),
    };
  }

  const article = dbPostToArticle(post);
  let related: DbPost[] = [];

  try {
    related = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        topicId: post.topicId,
        id: { not: post.id },
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 3,
      include: { topic: true },
    });
  } catch (error) {
    warnTopicStoreFallback(error);
  }

  return {
    post: article,
    relatedPosts: related.map(dbPostToArticle),
  };
}

export function getFallbackTopic(slug: string) {
  return getFallbackTopicBySlug(slug);
}

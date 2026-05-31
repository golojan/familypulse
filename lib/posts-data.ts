import { prisma } from "@/lib/prisma";
import { parseBlocks, type Block } from "@/lib/posts";

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  topicTitle: string | null;
  type: "ARTICLE" | "VIDEO" | "PODCAST";
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  updatedAt: Date;
};

export type PostEditorData = {
  id: string;
  title: string;
  slug: string;
  type: "ARTICLE" | "VIDEO" | "PODCAST";
  status: "DRAFT" | "PUBLISHED";
  excerpt: string | null;
  coverImage: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  topicId: string | null;
  blocks: Block[];
};

/** All posts owned by a user, newest activity first, grouped-ready for the dashboard. */
export async function listPostsByAuthor(authorId: string): Promise<PostListItem[]> {
  const posts = await prisma.post.findMany({
    where: { authorId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      type: true,
      topic: { select: { title: true } },
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
  return posts.map((post) => ({
    ...post,
    topicTitle: post.topic?.title ?? null,
  }));
}

export type PostStatusFilter = "ALL" | "DRAFT" | "PUBLISHED";

export type PostsPage = {
  items: PostListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  draftCount: number;
  publishedCount: number;
};

/**
 * One page of an author's posts (newest activity first), optionally filtered by
 * status, for the dashboard listing. Returns total counts so the UI can render a
 * pager and the status tabs.
 */
export async function listPostsPage(
  authorId: string,
  opts: { page?: number; perPage?: number; status?: PostStatusFilter } = {},
): Promise<PostsPage> {
  const perPage = Math.min(50, Math.max(1, opts.perPage ?? 10));
  const status = opts.status ?? "ALL";
  const where = {
    authorId,
    ...(status === "ALL" ? {} : { status }),
  };

  const [total, draftCount, publishedCount] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.count({ where: { authorId, status: "DRAFT" } }),
    prisma.post.count({ where: { authorId, status: "PUBLISHED" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, opts.page ?? 1), totalPages);

  const posts = await prisma.post.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      type: true,
      topic: { select: { title: true } },
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return {
    items: posts.map((post) => ({ ...post, topicTitle: post.topic?.title ?? null })),
    total,
    page,
    perPage,
    totalPages,
    draftCount,
    publishedCount,
  };
}

/** A single post owned by `authorId`, shaped for the editor. Null if missing or not owned. */
export async function getPostForEditor(
  id: string,
  authorId: string,
): Promise<PostEditorData | null> {
  const post = await prisma.post.findFirst({
    where: { id, authorId },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      status: true,
      excerpt: true,
      coverImage: true,
      videoUrl: true,
      audioUrl: true,
      topicId: true,
      blocks: true,
    },
  });
  if (!post) return null;

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    type: post.type,
    status: post.status,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    videoUrl: post.videoUrl,
    audioUrl: post.audioUrl,
    topicId: post.topicId,
    blocks: parseBlocks(post.blocks),
  };
}

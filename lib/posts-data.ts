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

/** A single post owned by `authorId`, shaped for the editor. Null if missing or not owned. */
export async function getPostForEditor(id: string, authorId: string): Promise<PostEditorData | null> {
  const post = await prisma.post.findFirst({
    where: { id, authorId },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      status: true,
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
    coverImage: post.coverImage,
    videoUrl: post.videoUrl,
    audioUrl: post.audioUrl,
    topicId: post.topicId,
    blocks: parseBlocks(post.blocks),
  };
}

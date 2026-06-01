"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PostType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { generateCoverForPost } from "@/lib/ai-drafts";
import { autoShareOnPublish, shareToFacebook } from "@/lib/facebook";
import {
  cleanBlocks,
  deriveCover,
  deriveExcerpt,
  parseBlocks,
  slugify,
  type Block,
} from "@/lib/posts";

export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: { title?: string; topic?: string; type?: string };
};

const CAN_PUBLISH_ROLES = ["EDITOR", "SUPERADMIN"];

/** Resolves the current author, enforcing that they are allowed to manage posts. */
async function requireAuthor() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  const canManage = session.user.roles?.some((r) => CAN_PUBLISH_ROLES.includes(r));
  if (!canManage) {
    throw new Error("FORBIDDEN");
  }
  return session.user.id;
}

/** Builds a slug unique across posts, ignoring the post we're currently editing. */
async function uniqueSlug(title: string, ignoreId?: string): Promise<string> {
  const base = slugify(title) || "post";
  let candidate = base;
  let n = 2;
  // Loop is bounded in practice; titles rarely collide more than a handful of times.
  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

function readBlocks(formData: FormData): Block[] {
  const raw = formData.get("blocks");
  if (typeof raw !== "string") return [];
  try {
    return cleanBlocks(parseBlocks(JSON.parse(raw)));
  } catch {
    return [];
  }
}

type SaveMode = "draft" | "publish";

/**
 * Create or update a post. `mode` decides the resulting status:
 * - "draft"   → status stays/returns to DRAFT
 * - "publish" → status becomes PUBLISHED and publishedAt is stamped once
 *
 * `postId` is empty for a new post. On success we redirect:
 * - new post  → to its edit page (so the author keeps working with an id)
 * - publish   → to the dashboard
 */
export async function savePost(
  postId: string,
  mode: SaveMode,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const authorId = await requireAuthor();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { ok: false, fieldErrors: { title: "A title is required." } };
  }

  const coverInput = String(formData.get("coverImage") ?? "").trim();
  const topicIdInput = String(formData.get("topicId") ?? "").trim();
  const typeInput = String(formData.get("type") ?? "ARTICLE");
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  // Podcasts are published as video too — there is no separate audio source.
  const audioUrl = null;
  const blocks = readBlocks(formData);
  const cover = coverInput || deriveCover(blocks);
  // SEO description: use the author's text, falling back to one derived from the
  // body so the meta description / excerpt is never empty.
  const excerptInput = String(formData.get("excerpt") ?? "").trim();
  const excerpt = excerptInput || deriveExcerpt(blocks);
  const blocksJson = JSON.parse(JSON.stringify(blocks)) as object;
  const topicId = topicIdInput || null;
  const type = Object.values(PostType).includes(typeInput as PostType)
    ? (typeInput as PostType)
    : PostType.ARTICLE;

  if (topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
    if (!topic) {
      return { ok: false, fieldErrors: { topic: "Choose a valid topic." } };
    }
  }

  let targetId = postId;

  if (postId) {
    // Ensure ownership before mutating.
    const owned = await prisma.post.findFirst({
      where: { id: postId, authorId },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!owned) {
      return { ok: false, error: "Post not found." };
    }
    if (owned.status === "PUBLISHED") {
      return { ok: false, error: "Unpublish this post before editing or saving drafts." };
    }

    const slug = await uniqueSlug(title, postId);
    await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        slug,
        type,
        excerpt,
        coverImage: cover,
        videoUrl,
        audioUrl,
        blocks: blocksJson,
        topicId,
        status: mode === "publish" ? "PUBLISHED" : "DRAFT",
        // Stamp publishedAt the first time it goes live; keep the original date afterwards.
        publishedAt: mode === "publish" ? (owned.publishedAt ?? new Date()) : owned.publishedAt,
      },
    });
  } else {
    const slug = await uniqueSlug(title);
    const created = await prisma.post.create({
      data: {
        title,
        slug,
        type,
        excerpt,
        coverImage: cover,
        videoUrl,
        audioUrl,
        blocks: blocksJson,
        topicId,
        status: mode === "publish" ? "PUBLISHED" : "DRAFT",
        publishedAt: mode === "publish" ? new Date() : null,
        authorId,
      },
      select: { id: true },
    });
    targetId = created.id;
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/topics");

  if (mode === "publish") {
    // Best-effort Facebook auto-post on first publish. Runs before redirect()
    // (which throws) and never blocks publishing. autoShareOnPublish itself
    // checks the enabled flag, config, and the already-shared guard.
    if (targetId) {
      await autoShareOnPublish(targetId);
    }
    redirect("/dashboard");
  }
  if (!postId) {
    // New draft: move the author onto the persistent edit URL.
    redirect(`/dashboard/posts/${targetId}/edit`);
  }
  return { ok: true };
}

/** Move a published post back to draft. */
export async function unpublishPost(postId: string) {
  const authorId = await requireAuthor();
  const owned = await prisma.post.findFirst({
    where: { id: postId, authorId },
    select: { id: true },
  });
  if (!owned) return;

  await prisma.post.update({
    where: { id: postId },
    data: { status: "DRAFT" },
  });
  revalidatePath("/dashboard");
}

/** Publish an existing draft directly from the dashboard. */
export async function publishPost(postId: string) {
  const authorId = await requireAuthor();
  const owned = await prisma.post.findFirst({
    where: { id: postId, authorId },
    select: { id: true, publishedAt: true },
  });
  if (!owned) return;

  await prisma.post.update({
    where: { id: postId },
    data: { status: "PUBLISHED", publishedAt: owned.publishedAt ?? new Date() },
  });
  revalidatePath("/dashboard");

  // Best-effort Facebook auto-post on first publish (no-op if already shared,
  // disabled, or unconfigured).
  await autoShareOnPublish(postId);
}

export type ShareResult = { ok: true } | { ok: false; error: string };

/**
 * Manually share a published post to Facebook (or re-share). Surfaces a result
 * the dashboard can show. Forces a share even if already posted.
 */
export async function shareToFacebookAction(postId: string): Promise<ShareResult> {
  let authorId: string;
  try {
    authorId = await requireAuthor();
  } catch {
    return { ok: false, error: "You don't have permission to do that." };
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, authorId },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      status: true,
      facebookPostId: true,
    },
  });
  if (!post) return { ok: false, error: "Post not found." };
  if (post.status !== "PUBLISHED") {
    return { ok: false, error: "Publish the post before sharing it to Facebook." };
  }

  const result = await shareToFacebook(post, { force: true });
  if (result.ok) {
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const messages: Record<string, string> = {
    "not-configured": "Facebook is not configured (Site Settings → Facebook Auto-post).",
    disabled:
      "Facebook auto-post is off, but manual share should still work — check configuration.",
    "already-shared": "Already shared.",
    error: result.error ?? "Facebook share failed.",
  };
  return { ok: false, error: messages[result.reason] ?? "Facebook share failed." };
}

export type GenerateCoverResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Generate an AI cover illustration for the post being edited, from its current
 * title (+ topic and SEO description for variety). Returns the uploaded public
 * URL; the editor sets it as the cover without needing to save first.
 */
export async function generateCover(input: {
  topicId: string | null;
  title: string;
  description?: string;
}): Promise<GenerateCoverResult> {
  let authorId: string;
  try {
    authorId = await requireAuthor();
  } catch {
    return { ok: false, error: "You don't have permission to do that." };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Add a title first so the cover reflects the post." };
  }

  // The generator keys its scene off the topic slug, so resolve it. A missing
  // topic still works (falls back to a generic family scene).
  let topicSlug = "";
  if (input.topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: input.topicId },
      select: { slug: true },
    });
    topicSlug = topic?.slug ?? "";
  }

  try {
    const url = await generateCoverForPost(
      { title, slug: topicSlug, description: input.description ?? null },
      title,
      authorId,
    );
    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cover generation failed.",
    };
  }
}

/** Permanently delete a post the author owns. */
export async function deletePost(postId: string) {
  const authorId = await requireAuthor();
  await prisma.post.deleteMany({ where: { id: postId, authorId } });
  revalidatePath("/dashboard");
}

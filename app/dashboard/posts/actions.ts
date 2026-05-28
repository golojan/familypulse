"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
  fieldErrors?: { title?: string; topic?: string };
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
  const blocks = readBlocks(formData);
  const cover = coverInput || deriveCover(blocks);
  const excerpt = deriveExcerpt(blocks);
  const blocksJson = JSON.parse(JSON.stringify(blocks)) as object;
  const topicId = topicIdInput || null;

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

    const slug = await uniqueSlug(title, postId);
    await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        slug,
        excerpt,
        coverImage: cover,
        blocks: blocksJson,
        topicId,
        status: mode === "publish" ? "PUBLISHED" : "DRAFT",
        // Stamp publishedAt the first time it goes live; keep the original date afterwards.
        publishedAt:
          mode === "publish" ? (owned.publishedAt ?? new Date()) : owned.publishedAt,
      },
    });
  } else {
    const slug = await uniqueSlug(title);
    const created = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        coverImage: cover,
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
}

/** Permanently delete a post the author owns. */
export async function deletePost(postId: string) {
  const authorId = await requireAuthor();
  await prisma.post.deleteMany({ where: { id: postId, authorId } });
  revalidatePath("/dashboard");
}

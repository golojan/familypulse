import "server-only";

import { prisma } from "@/lib/prisma";
import { generateCoverForPost } from "@/lib/ai-drafts";
import { cleanBlocks, deriveCover, deriveExcerpt, parseBlocks } from "@/lib/posts";

/**
 * Automated post audit (see app/api/cron/audit).
 *
 * Walks the post library a small batch at a time (least-recently-audited first)
 * and repairs structural issues without rewriting the author's words:
 *  - blocks: re-parse + clean (drops malformed/empty blocks)
 *  - excerpt (SEO description): re-derive from the body when missing/blank
 *  - cover image: generate one when missing, or regenerate when the stored URL
 *    is dead (404/unreachable)
 *
 * Published posts are unpublished first, fixed, then re-published (preserving the
 * original publishedAt) so a half-fixed post is never live. Every post processed
 * gets its `lastAuditedAt` stamped so subsequent runs move through the library.
 */

const DEFAULT_BATCH = 5;

export type AuditResult = {
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  scanned: number;
  fixed: number;
  postIds: string[];
  detail?: string;
};

type AuditablePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  blocks: unknown;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  authorId: string;
  topic: { title: string; slug: string } | null;
};

/**
 * Run one audit pass over up to `batchSize` posts. Never throws — per-post
 * failures are collected into the returned detail.
 */
export async function auditPosts(batchSize = DEFAULT_BATCH): Promise<AuditResult> {
  let posts: AuditablePost[];
  try {
    posts = await prisma.post.findMany({
      orderBy: [{ lastAuditedAt: { sort: "asc", nulls: "first" } }, { updatedAt: "asc" }],
      take: batchSize,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        blocks: true,
        status: true,
        publishedAt: true,
        authorId: true,
        topic: { select: { title: true, slug: true } },
      },
    });
  } catch (err) {
    return {
      status: "FAILED",
      scanned: 0,
      fixed: 0,
      postIds: [],
      detail: `Could not read posts: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }

  if (posts.length === 0) {
    return { status: "SUCCESS", scanned: 0, fixed: 0, postIds: [] };
  }

  const fixedIds: string[] = [];
  const errors: string[] = [];

  for (const post of posts) {
    try {
      const changed = await auditOne(post, errors);
      if (changed) fixedIds.push(post.id);
    } catch (err) {
      errors.push(`${post.slug}: ${err instanceof Error ? err.message : "unknown error"}`);
      // Still stamp it so a persistently-failing post doesn't block the queue.
      await stampAudited(post.id);
    }
  }

  const status: AuditResult["status"] =
    errors.length === 0 ? "SUCCESS" : fixedIds.length > 0 ? "PARTIAL" : "FAILED";

  return {
    status,
    scanned: posts.length,
    fixed: fixedIds.length,
    postIds: fixedIds,
    detail: errors.length > 0 ? errors.join("; ").slice(0, 1000) : undefined,
  };
}

/**
 * Audit a single post. Returns true if anything was changed. For published
 * posts, unpublishes before writing fixes and re-publishes afterward.
 */
async function auditOne(post: AuditablePost, errors: string[]): Promise<boolean> {
  const data: Record<string, unknown> = {};

  // --- Blocks: re-parse + clean. Only persist if it actually changed. ---
  const cleaned = cleanBlocks(parseBlocks(post.blocks));
  const cleanedJson = JSON.parse(JSON.stringify(cleaned)) as object;
  const originalJson = JSON.stringify(post.blocks ?? []);
  if (JSON.stringify(cleanedJson) !== originalJson) {
    data.blocks = cleanedJson;
  }

  // --- Excerpt (SEO description): re-derive when missing/blank. ---
  if (!post.excerpt || post.excerpt.trim() === "") {
    const derived = deriveExcerpt(cleaned);
    if (derived) data.excerpt = derived;
  }

  // --- Cover image: generate when missing, regenerate when broken. ---
  const coverNeedsFix =
    !post.coverImage || post.coverImage.trim() === "" || !(await isUrlLive(post.coverImage));
  if (coverNeedsFix) {
    // Prefer an in-body image before spending an AI image call.
    const bodyCover = deriveCover(cleaned);
    if (bodyCover && (await isUrlLive(bodyCover))) {
      data.coverImage = bodyCover;
    } else if (post.topic) {
      try {
        data.coverImage = await generateCoverForPost(
          { ...post.topic, description: post.excerpt },
          post.title,
          post.authorId,
        );
      } catch (err) {
        errors.push(
          `${post.slug}: cover regenerate failed (${err instanceof Error ? err.message : "unknown"})`,
        );
      }
    } else {
      errors.push(`${post.slug}: cover missing and no topic to generate from`);
    }
  }

  const hasChanges = Object.keys(data).length > 0;

  if (!hasChanges) {
    await stampAudited(post.id);
    return false;
  }

  if (post.status === "PUBLISHED") {
    // Unpublish → fix → republish so a partially-fixed post is never live.
    await prisma.post.update({ where: { id: post.id }, data: { status: "DRAFT" } });
    await prisma.post.update({
      where: { id: post.id },
      data: {
        ...data,
        status: "PUBLISHED",
        publishedAt: post.publishedAt ?? new Date(),
        lastAuditedAt: new Date(),
      },
    });
  } else {
    await prisma.post.update({
      where: { id: post.id },
      data: { ...data, lastAuditedAt: new Date() },
    });
  }

  return true;
}

function stampAudited(id: string) {
  return prisma.post.update({ where: { id }, data: { lastAuditedAt: new Date() } });
}

/**
 * Whether an image URL is reachable (not 404/dead). Tries HEAD, falling back to
 * a ranged GET for hosts that don't support HEAD. Any network error counts as
 * "not live" so we regenerate. Bounded by a short timeout.
 */
async function isUrlLive(url: string | null): Promise<boolean> {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let res = await fetch(url, { method: "HEAD", signal: controller.signal });
    if (res.status === 405 || res.status === 403) {
      // Some CDNs reject HEAD; retry a tiny ranged GET.
      res = await fetch(url, {
        method: "GET",
        headers: { range: "bytes=0-0" },
        signal: controller.signal,
      });
    }
    return res.ok || res.status === 206;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run an audit pass and record it as an AiDraftRun (trigger "audit") for the
 * admin history, mirroring how generation runs are logged.
 */
export async function runAudit(
  trigger: "cron" | "manual",
  batchSize = DEFAULT_BATCH,
): Promise<AuditResult> {
  const result = await auditPosts(batchSize);

  await prisma.aiDraftRun.create({
    data: {
      status: result.status,
      provider: "audit",
      model: "audit",
      trigger,
      created: result.fixed,
      detail:
        result.detail ??
        (result.scanned === 0
          ? "No posts to audit."
          : `Scanned ${result.scanned}, fixed ${result.fixed}.`),
      postIds: result.postIds,
    },
  });

  return result;
}

import "server-only";

import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/seo";

/**
 * Facebook Page auto-posting.
 *
 * When a post is first published (and Facebook auto-post is enabled in Site
 * Settings), we share it to the configured Facebook Page as a link post via the
 * Graph API. Facebook scrapes the article URL's OpenGraph tags to render the
 * cover image + title card, so the link post looks rich without uploading media.
 *
 * Sharing is idempotent: a post that already has a `facebookPostId` is never
 * re-shared automatically (so unpublish→republish or the audit's republish cycle
 * don't create duplicates). The manual "Share to Facebook" action can force a
 * re-share.
 */

const DEFAULT_GRAPH_VERSION = "v25.0";
const FB_TIMEOUT_MS = 20_000;

type FacebookConfig = {
  enabled: boolean;
  pageId: string;
  accessToken: string;
  graphVersion: string;
};

/** Resolve Facebook config from settings (DB → env). */
async function getFacebookConfig(): Promise<FacebookConfig> {
  const s = await getSettings();
  return {
    enabled: (s.FACEBOOK_AUTOPOST_ENABLED ?? "").trim().toLowerCase() === "true",
    pageId: (s.FACEBOOK_PAGE_ID ?? "").trim(),
    accessToken: (s.FACEBOOK_PAGE_ACCESS_TOKEN ?? "").trim(),
    graphVersion: normalizeGraphVersion(s.FACEBOOK_GRAPH_VERSION),
  };
}

function normalizeGraphVersion(raw: string | undefined): string {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return DEFAULT_GRAPH_VERSION;
  return v.startsWith("v") ? v : `v${v}`;
}

export type FacebookShareResult =
  | { ok: true; facebookPostId: string }
  | {
      ok: false;
      reason: "disabled" | "not-configured" | "already-shared" | "error";
      error?: string;
    };

type SharePostInput = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  facebookPostId: string | null;
};

/** Compose the Facebook message from the post's title + excerpt. */
function buildMessage(post: SharePostInput): string {
  const parts = [post.title.trim()];
  const excerpt = post.excerpt?.trim();
  if (excerpt) parts.push(excerpt);
  return parts.join("\n\n").slice(0, 5000);
}

async function fetchWithTimeout(url: string, init: RequestInit, label: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FB_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`${label} timed out`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Share a post to the configured Facebook Page as a link post. Persists the
 * returned Facebook post id on the post. Never throws — returns a result the
 * caller can log/surface. `force` re-shares even if already shared (manual use).
 */
export async function shareToFacebook(
  post: SharePostInput,
  opts: { force?: boolean } = {},
): Promise<FacebookShareResult> {
  const config = await getFacebookConfig();

  if (!config.enabled && !opts.force) return { ok: false, reason: "disabled" };
  if (!config.pageId || !config.accessToken) {
    return { ok: false, reason: "not-configured" };
  }
  if (post.facebookPostId && !opts.force) {
    return { ok: false, reason: "already-shared" };
  }

  const link = absoluteUrl(`/posts/${post.slug}`);
  const message = buildMessage(post);
  const endpoint = `https://graph.facebook.com/${config.graphVersion}/${encodeURIComponent(
    config.pageId,
  )}/feed`;

  try {
    const body = new URLSearchParams({
      message,
      link,
      access_token: config.accessToken,
    });
    const res = await fetchWithTimeout(endpoint, { method: "POST", body }, "Facebook share");
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: { message?: string };
    };
    if (!res.ok || !data.id) {
      return {
        ok: false,
        reason: "error",
        error: data.error?.message ?? `Facebook returned ${res.status}`,
      };
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { facebookPostId: data.id },
    });

    return { ok: true, facebookPostId: data.id };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      error: err instanceof Error ? err.message : "Unknown Facebook error",
    };
  }
}

/**
 * Auto-share helper for the publish flow. Best-effort: looks up the post, shares
 * it if eligible, and swallows everything (logs only) so a Facebook problem can
 * never block or fail a publish.
 */
export async function autoShareOnPublish(postId: string): Promise<void> {
  try {
    const config = await getFacebookConfig();
    if (!config.enabled || !config.pageId || !config.accessToken) return;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        status: true,
        type: true,
        facebookPostId: true,
      },
    });
    // Only share published posts that haven't been shared yet.
    if (!post || post.status !== "PUBLISHED" || post.facebookPostId) return;

    const result = await shareToFacebook(post);
    if (!result.ok && result.reason === "error") {
      console.warn(`Facebook auto-post failed for ${postId}: ${result.error}`);
    }
  } catch (err) {
    console.warn("Facebook auto-post error:", err);
  }
}

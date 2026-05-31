import "server-only";

import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { uploadGeneratedImage } from "@/lib/storage";
import {
  cleanBlocks,
  deriveExcerpt,
  newBlockId,
  parseBlocks,
  slugify,
  type Block,
} from "@/lib/posts";

/**
 * Scheduled AI draft generation.
 *
 * The admin configures everything in Site Settings (see lib/settings-catalog):
 * which provider, model, how often, how many drafts per run, and an optional
 * topic to focus on. This module owns the provider calls and the persistence;
 * the cron route (app/api/cron/generate-drafts) owns the schedule + gating, and
 * a superadmin can also trigger a run on demand from the Pulse AI page.
 *
 * Generated posts are ALWAYS saved as DRAFT — nothing is auto-published. An
 * editor reviews and publishes from the dashboard like any other draft.
 */

export type AiProvider = "anthropic" | "deepseek";

const DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-8";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-1";
const DEFAULT_INTERVAL_MINUTES = 60;
const DEFAULT_PER_RUN = 1;
const MAX_PER_RUN = 5;

export type ImageQuality = "low" | "medium" | "high" | "auto";
const IMAGE_QUALITIES: readonly ImageQuality[] = ["low", "medium", "high", "auto"];
const DEFAULT_IMAGE_QUALITY: ImageQuality = "medium";

export type DraftConfig = {
  enabled: boolean;
  provider: AiProvider;
  intervalMinutes: number;
  perRun: number;
  topicSlug: string | null;
  model: string;
  apiKey: string | undefined;
  /** Cover image generation (OpenAI). Independent of the text provider. */
  coverImages: boolean;
  openaiApiKey: string | undefined;
  openaiImageModel: string;
  openaiImageQuality: ImageQuality;
};

/** Resolve and normalize the AI draft settings from the database/env. */
export async function getDraftConfig(): Promise<DraftConfig> {
  const s = await getSettings();

  const provider: AiProvider =
    (s.AI_DRAFTS_PROVIDER ?? "").toLowerCase() === "deepseek" ? "deepseek" : "anthropic";

  const intervalMinutes = clampInt(
    s.AI_DRAFTS_INTERVAL_MINUTES,
    DEFAULT_INTERVAL_MINUTES,
    1,
    60 * 24 * 7,
  );
  const perRun = clampInt(s.AI_DRAFTS_PER_RUN, DEFAULT_PER_RUN, 1, MAX_PER_RUN);
  const topicSlug = s.AI_DRAFTS_TOPIC_SLUG?.trim() || null;

  const model =
    provider === "deepseek"
      ? s.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL
      : s.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;

  const apiKey = provider === "deepseek" ? s.DEEPSEEK_API_KEY : s.ANTHROPIC_API_KEY;

  return {
    enabled: (s.AI_DRAFTS_ENABLED ?? "").trim().toLowerCase() === "true",
    provider,
    intervalMinutes,
    perRun,
    topicSlug,
    model,
    apiKey,
    coverImages: (s.AI_DRAFTS_COVER_IMAGES ?? "").trim().toLowerCase() === "true",
    openaiApiKey: s.OPENAI_API_KEY,
    openaiImageModel: s.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_OPENAI_IMAGE_MODEL,
    openaiImageQuality: parseImageQuality(s.OPENAI_IMAGE_QUALITY),
  };
}

/** Normalize the configured image quality, defaulting to medium for unknown values. */
function parseImageQuality(raw: string | undefined): ImageQuality {
  const value = (raw ?? "").trim().toLowerCase();
  return (IMAGE_QUALITIES as readonly string[]).includes(value)
    ? (value as ImageQuality)
    : DEFAULT_IMAGE_QUALITY;
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number.parseInt((raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export type RunResult = {
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  created: number;
  postIds: string[];
  detail?: string;
};

/**
 * Whether enough time has elapsed since the last run to run again. Reads the
 * most recent AiDraftRun and compares against the configured interval.
 */
export async function isIntervalElapsed(intervalMinutes: number): Promise<boolean> {
  const last = await prisma.aiDraftRun.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!last) return true;
  const elapsedMs = Date.now() - last.createdAt.getTime();
  return elapsedMs >= intervalMinutes * 60_000;
}

type TopicSeed = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  writerPrompt: string | null;
};

/**
 * Pick topics to write about. When a specific slug is configured we always use
 * it; otherwise we rotate by choosing the topics that have gone longest without
 * a generated draft (least-recently-used), so coverage stays balanced.
 */
async function pickTopics(topicSlug: string | null, count: number): Promise<TopicSeed[]> {
  if (topicSlug) {
    const topic = await prisma.topic.findUnique({
      where: { slug: topicSlug },
      select: { id: true, title: true, slug: true, description: true, writerPrompt: true },
    });
    if (!topic) return [];
    // Same topic can be used for every draft in the run.
    return Array.from({ length: count }, () => topic);
  }

  const topics = await prisma.topic.findMany({
    select: { id: true, title: true, slug: true, description: true, writerPrompt: true },
    orderBy: { createdAt: "asc" },
  });
  if (topics.length === 0) return [];

  // Rotate: order topics by the recency of their newest post (nulls first), then
  // take `count`, wrapping if there are fewer topics than drafts requested.
  const newestByTopic = await prisma.post.groupBy({
    by: ["topicId"],
    _max: { createdAt: true },
  });
  const lastUsed = new Map<string, number>();
  for (const row of newestByTopic) {
    if (row.topicId) lastUsed.set(row.topicId, row._max.createdAt?.getTime() ?? 0);
  }
  const ordered = [...topics].sort((a, b) => (lastUsed.get(a.id) ?? 0) - (lastUsed.get(b.id) ?? 0));

  return Array.from({ length: count }, (_, i) => ordered[i % ordered.length]);
}

/** The author for generated drafts: the earliest superadmin. */
async function resolveAuthorId(): Promise<string | null> {
  const admin = await prisma.user.findFirst({
    where: { roles: { has: "SUPERADMIN" } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return admin?.id ?? null;
}

/** Builds a slug unique across posts. */
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "draft";
  let candidate = base;
  let n = 2;
  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

/**
 * Run a generation pass: produce `config.perRun` draft posts. Records a single
 * AiDraftRun row summarizing the outcome. Never throws — failures are captured
 * in the returned RunResult and persisted for the admin to see.
 */
export async function generateDrafts(
  config: DraftConfig,
  trigger: "cron" | "manual",
): Promise<RunResult> {
  const result = await runGeneration(config);

  await prisma.aiDraftRun.create({
    data: {
      status: result.status,
      provider: config.provider,
      model: config.model,
      trigger,
      created: result.created,
      detail: result.detail,
      postIds: result.postIds,
    },
  });

  return result;
}

async function runGeneration(config: DraftConfig): Promise<RunResult> {
  if (!config.apiKey) {
    return {
      status: "FAILED",
      created: 0,
      postIds: [],
      detail: `Missing API key for ${config.provider}.`,
    };
  }

  const authorId = await resolveAuthorId();
  if (!authorId) {
    return {
      status: "FAILED",
      created: 0,
      postIds: [],
      detail: "No SUPERADMIN user to author drafts.",
    };
  }

  const topics = await pickTopics(config.topicSlug, config.perRun);
  if (topics.length === 0) {
    return {
      status: "FAILED",
      created: 0,
      postIds: [],
      detail: config.topicSlug
        ? `Topic "${config.topicSlug}" not found.`
        : "No topics exist to write about.",
    };
  }

  const postIds: string[] = [];
  const errors: string[] = [];

  for (const topic of topics) {
    try {
      const generated = await callProvider(config, topic);
      const blocks = cleanBlocks(parseBlocks(generated.blocks));
      const title = generated.title.trim().slice(0, 200);
      if (!title || blocks.length === 0) {
        errors.push(`${topic.slug}: model returned empty content`);
        continue;
      }

      // Cover image is best-effort: a failure here must not lose the article.
      let coverImage: string | null = null;
      if (config.coverImages && config.openaiApiKey) {
        try {
          coverImage = await generateCoverImage(config, topic, title, authorId);
        } catch (err) {
          errors.push(
            `${topic.slug}: cover image failed (${err instanceof Error ? err.message : "unknown"})`,
          );
        }
      }

      const slug = await uniqueSlug(title);
      const blocksJson = JSON.parse(JSON.stringify(blocks)) as object;
      const created = await prisma.post.create({
        data: {
          title,
          slug,
          type: "ARTICLE",
          excerpt: deriveExcerpt(blocks),
          coverImage,
          blocks: blocksJson,
          status: "DRAFT",
          topicId: topic.id,
          authorId,
        },
        select: { id: true },
      });
      postIds.push(created.id);
    } catch (err) {
      errors.push(`${topic.slug}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  const status: RunResult["status"] =
    postIds.length === 0 ? "FAILED" : errors.length > 0 ? "PARTIAL" : "SUCCESS";

  return {
    status,
    created: postIds.length,
    postIds,
    detail: errors.length > 0 ? errors.join("; ").slice(0, 1000) : undefined,
  };
}

type GeneratedPost = { title: string; blocks: unknown };

/**
 * The shared prompt. We ask the model for strict JSON matching our Block shape
 * (see lib/posts) so the result drops straight into the editor. The topic's
 * `writerPrompt` (set by an editor) steers tone and angle.
 */
function buildPrompt(topic: TopicSeed): { system: string; user: string } {
  const system = [
    "You are an editorial writer for FamilyPulse, a warm, practical publication about family life, parenting, relationships, and wellbeing.",
    "Write an original, publish-ready article — not an outline or a draft to be finished later. It should read as a complete, polished piece a human editor could publish with only a quick review.",
    "",
    "Length & pacing: a 3–5 minute read, roughly 700–1100 words. Use 8–14 blocks total.",
    "Structure: a compelling title; an engaging opening paragraph that sets up the problem; 3–5 H2 subheadings (level 2), each followed by 1–3 short paragraphs (3–4 sentences each); at least one list (bullet or numbered) of practical, specific tips; optionally one short quote; and a final paragraph that ends with a clear, encouraging call to action for the reader.",
    "Quality: be specific, concrete, and genuinely useful — real examples and actionable steps, not platitudes. Maintain a warm, conversational, trustworthy tone. Proofread for grammar and clarity. Avoid clichés, filler, keyword stuffing, and any medical, legal, or financial claims; speak in general supportive terms instead.",
    "",
    "Return ONLY a JSON object — no markdown fences, no commentary — matching exactly this TypeScript shape:",
    '{ "title": string, "blocks": Block[] }',
    "where each Block is one of:",
    '{ "type": "heading", "level": 2 | 3, "text": string }',
    '{ "type": "paragraph", "text": string }',
    '{ "type": "quote", "text": string, "cite"?: string }',
    '{ "type": "list", "ordered": boolean, "items": string[] }',
    "Do NOT include image blocks — a cover image is generated separately.",
  ].join("\n");

  const user = [
    `Topic: ${topic.title}`,
    topic.description ? `Topic description: ${topic.description}` : "",
    topic.writerPrompt ? `Editorial guidance: ${topic.writerPrompt}` : "",
    "Write one fresh, complete, publish-ready article for this topic now.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

async function callProvider(config: DraftConfig, topic: TopicSeed): Promise<GeneratedPost> {
  const { system, user } = buildPrompt(topic);
  const raw =
    config.provider === "deepseek"
      ? await callDeepSeek(config, system, user)
      : await callAnthropic(config, system, user);
  return coerceGenerated(raw);
}

/** Anthropic Messages API. */
async function callAnthropic(config: DraftConfig, system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Anthropic returned no text content");
  return text;
}

/** DeepSeek's OpenAI-compatible chat completions API. */
async function callDeepSeek(config: DraftConfig, system: string, user: string): Promise<string> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey as string}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("DeepSeek returned no content");
  return text;
}

/**
 * Generate a cover image for the draft with OpenAI's image API, upload it to
 * Spaces, register it as a MediaAsset, and return its public URL. Throws on any
 * failure so the caller can record it without losing the article.
 */
async function generateCoverImage(
  config: DraftConfig,
  topic: TopicSeed,
  title: string,
  authorId: string,
): Promise<string> {
  const prompt = [
    `A photorealistic editorial cover photograph for a family-and-wellbeing article titled "${title}".`,
    `Theme: ${topic.title}.`,
    "Candid, natural documentary-style photography of a real, diverse, wholesome family moment.",
    "Shot on a full-frame DSLR with a 35mm lens, shallow depth of field, soft natural window light, true-to-life skin tones, realistic textures and detail, high dynamic range.",
    "Warm, hopeful, authentic mood. Photojournalistic, not staged or stock-looking.",
    "No text, no words, no captions, no logos, no watermarks, no illustration or cartoon style. Composition leaves calm negative space.",
  ].join(" ");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.openaiApiKey as string}`,
    },
    body: JSON.stringify({
      model: config.openaiImageModel,
      prompt,
      n: 1,
      size: "1536x1024", // landscape, suits a cover
      quality: config.openaiImageQuality, // admin-configurable; defaults to medium
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI image ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  const item = data.data?.[0];

  let body: Buffer;
  let contentType = "image/png";
  if (item?.b64_json) {
    body = Buffer.from(item.b64_json, "base64");
  } else if (item?.url) {
    // Some configurations return a URL instead of inline base64.
    const img = await fetch(item.url);
    if (!img.ok) throw new Error(`fetching generated image failed (${img.status})`);
    contentType = img.headers.get("content-type") ?? "image/png";
    body = Buffer.from(await img.arrayBuffer());
  } else {
    throw new Error("OpenAI returned no image data");
  }

  const uploaded = await uploadGeneratedImage({ body, contentType, prefix: "ai-drafts/covers" });

  // Register in the media library so it's visible/manageable like any upload.
  await prisma.mediaAsset.create({
    data: {
      key: uploaded.key,
      url: uploaded.publicUrl,
      filename: `${slugify(title) || "cover"}.${contentType === "image/png" ? "png" : "jpg"}`,
      alt: title,
      kind: "IMAGE",
      status: "READY",
      contentType: uploaded.contentType,
      size: uploaded.size,
      uploadedById: authorId,
    },
  });

  return uploaded.publicUrl;
}

/**
 * Parse the model's text into a GeneratedPost. Models sometimes wrap JSON in
 * ```json fences or add prose; we extract the first balanced JSON object.
 */
function coerceGenerated(raw: string): GeneratedPost {
  const json = extractJson(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Model output was not valid JSON");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model output was not a JSON object");
  }
  const obj = parsed as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title : "";
  // parseBlocks (in the caller) does the real validation; just ensure blocks is
  // forwarded and every block has an id so the editor renders it.
  const blocks = Array.isArray(obj.blocks)
    ? obj.blocks.map((b) =>
        b && typeof b === "object" ? { id: newBlockId(), ...(b as object) } : b,
      )
    : [];
  return { title, blocks };
}

/** Strip markdown fences / surrounding prose and return the JSON object substring. */
function extractJson(raw: string): string {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return trimmed;
  return trimmed.slice(start, end + 1);
}

// Keep Block in the type graph so future edits to the block shape surface here.
export type { Block };

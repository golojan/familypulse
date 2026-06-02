import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

/**
 * WhatsApp Cloud API (Meta Graph) integration.
 *
 * This module backs the webhook callback route (app/api/whatsapp/route.ts) and
 * provides an outbound send helper so the app can reply to inbound messages via
 * the Graph API. It mirrors the Facebook auto-post integration (lib/facebook.ts):
 * config resolves from Site Settings (DB → env), all external calls are
 * best-effort with an AbortController timeout, and nothing throws into the route.
 *
 * Webhook security:
 * - GET handshake: Meta calls the callback URL with `hub.mode=subscribe`,
 *   `hub.verify_token`, and `hub.challenge`. We echo the challenge only when the
 *   verify token matches the configured one.
 * - POST notifications: every payload is signed with the app secret as
 *   `X-Hub-Signature-256: sha256=<hex>` over the raw request body. We verify that
 *   HMAC (timing-safe) before trusting the payload.
 */

const DEFAULT_GRAPH_VERSION = "v25.0";
const WA_TIMEOUT_MS = 20_000;

export type WhatsAppConfig = {
  enabled: boolean;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  verifyToken: string;
  appSecret: string;
  graphVersion: string;
};

function normalizeGraphVersion(raw: string | undefined): string {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return DEFAULT_GRAPH_VERSION;
  return v.startsWith("v") ? v : `v${v}`;
}

/** Resolve WhatsApp config from settings (DB → env). */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const s = await getSettings();
  return {
    enabled: (s.WHATSAPP_ENABLED ?? "").trim().toLowerCase() === "true",
    phoneNumberId: (s.WHATSAPP_PHONE_NUMBER_ID ?? "").trim(),
    businessAccountId: (s.WHATSAPP_BUSINESS_ACCOUNT_ID ?? "").trim(),
    accessToken: (s.WHATSAPP_ACCESS_TOKEN ?? "").trim(),
    verifyToken: (s.WHATSAPP_VERIFY_TOKEN ?? "").trim(),
    appSecret: (s.WHATSAPP_APP_SECRET ?? "").trim(),
    graphVersion: normalizeGraphVersion(s.WHATSAPP_GRAPH_VERSION),
  };
}

/**
 * Verify the Meta webhook subscription handshake. Returns the challenge string
 * to echo back when the mode + verify token are valid, otherwise null.
 */
export function verifyWebhookSubscription(
  config: WhatsAppConfig,
  params: { mode: string | null; token: string | null; challenge: string | null },
): string | null {
  if (!config.verifyToken) return null;
  if (params.mode !== "subscribe") return null;
  if (!params.token || !safeEqual(params.token, config.verifyToken)) return null;
  return params.challenge;
}

/**
 * Verify the `X-Hub-Signature-256` header against the raw request body using the
 * app secret. `signatureHeader` is the full header value, e.g. "sha256=abc...".
 * Returns false when the app secret is unset (fail closed) or the digest differs.
 */
export function verifyWebhookSignature(
  config: WhatsAppConfig,
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!config.appSecret) return false;
  if (!signatureHeader) return false;

  const [scheme, provided] = signatureHeader.split("=");
  if (scheme !== "sha256" || !provided) return false;

  const expected = createHmac("sha256", config.appSecret).update(rawBody, "utf8").digest("hex");
  return safeEqual(provided, expected);
}

/** Constant-time string comparison that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** A single inbound WhatsApp message, flattened from the webhook payload. */
export type InboundMessage = {
  /** Sender's WhatsApp phone number (wa_id), in international format without "+". */
  from: string;
  /** WhatsApp message id (wamid...). */
  messageId: string;
  /** Message type as reported by WhatsApp (text, image, audio, button, etc.). */
  type: string;
  /** Body text for text/button messages; empty for media-only messages. */
  text: string;
  /** The phone number id that received the message (our number). */
  phoneNumberId: string;
  /** Unix timestamp (seconds) the message was sent, when present. */
  timestamp?: string;
  /** The original message object from the payload, kept for capture/debugging. */
  raw?: unknown;
};

/**
 * Parse a WhatsApp Cloud API webhook payload into a flat list of inbound
 * messages. The payload nests messages under entry[].changes[].value.messages;
 * status callbacks (delivered/read) carry no `messages` and yield nothing here.
 * Tolerant of shape drift — anything unexpected is skipped rather than thrown.
 */
export function parseInboundMessages(payload: unknown): InboundMessage[] {
  const out: InboundMessage[] = [];
  if (!isRecord(payload) || payload.object !== "whatsapp_business_account") return out;

  const entries = asArray(payload.entry);
  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    for (const change of asArray(entry.changes)) {
      if (!isRecord(change)) continue;
      const value = isRecord(change.value) ? change.value : undefined;
      if (!value) continue;

      const metadata = isRecord(value.metadata) ? value.metadata : undefined;
      const phoneNumberId = typeof metadata?.phone_number_id === "string"
        ? metadata.phone_number_id
        : "";

      for (const message of asArray(value.messages)) {
        if (!isRecord(message)) continue;
        const type = typeof message.type === "string" ? message.type : "unknown";
        out.push({
          from: typeof message.from === "string" ? message.from : "",
          messageId: typeof message.id === "string" ? message.id : "",
          type,
          text: extractText(message, type),
          phoneNumberId,
          timestamp: typeof message.timestamp === "string" ? message.timestamp : undefined,
          raw: message,
        });
      }
    }
  }
  return out;
}

/** Pull the human-readable body out of a message by type. */
function extractText(message: Record<string, unknown>, type: string): string {
  if (type === "text" && isRecord(message.text) && typeof message.text.body === "string") {
    return message.text.body;
  }
  if (type === "button" && isRecord(message.button) && typeof message.button.text === "string") {
    return message.button.text;
  }
  if (type === "interactive" && isRecord(message.interactive)) {
    const i = message.interactive;
    if (isRecord(i.button_reply) && typeof i.button_reply.title === "string") {
      return i.button_reply.title;
    }
    if (isRecord(i.list_reply) && typeof i.list_reply.title === "string") {
      return i.list_reply.title;
    }
  }
  return "";
}

/**
 * Persist an inbound message. Idempotent on the WhatsApp message id: a
 * redelivered webhook updates the existing row rather than inserting a duplicate.
 * Best-effort — never throws into the webhook handler.
 */
export async function captureInboundMessage(message: InboundMessage): Promise<void> {
  const sentAt = parseTimestamp(message.timestamp);
  const data = {
    direction: "INBOUND" as const,
    fromNumber: message.from,
    toNumber: message.phoneNumberId || null,
    phoneNumberId: message.phoneNumberId || null,
    type: message.type,
    body: message.text || null,
    sentAt,
    raw: toJson(message.raw),
  };

  try {
    if (message.messageId) {
      await prisma.whatsAppMessage.upsert({
        where: { messageId: message.messageId },
        create: { messageId: message.messageId, ...data },
        update: data,
      });
    } else {
      await prisma.whatsAppMessage.create({ data });
    }
  } catch (err) {
    console.warn("WhatsApp inbound capture failed:", err);
  }
}

/**
 * Persist an outbound message we sent. Best-effort — logging only on failure so
 * a capture error never affects the send result.
 */
export async function captureOutboundMessage(input: {
  to: string;
  body: string;
  messageId?: string;
  phoneNumberId?: string;
}): Promise<void> {
  try {
    await prisma.whatsAppMessage.create({
      data: {
        direction: "OUTBOUND",
        fromNumber: input.phoneNumberId ?? "",
        toNumber: input.to,
        phoneNumberId: input.phoneNumberId ?? null,
        type: "text",
        body: input.body,
        messageId: input.messageId ?? null,
      },
    });
  } catch (err) {
    console.warn("WhatsApp outbound capture failed:", err);
  }
}

/** Convert a WhatsApp seconds-epoch string into a Date, when valid. */
function parseTimestamp(ts: string | undefined): Date | null {
  if (!ts) return null;
  const secs = Number(ts);
  if (!Number.isFinite(secs) || secs <= 0) return null;
  return new Date(secs * 1000);
}

/** Narrow unknown payload fragments to a Prisma-acceptable JSON value. */
function toJson(value: unknown): object | undefined {
  return isRecord(value) ? value : undefined;
}

export type SendResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: "not-configured" | "error"; error?: string };

/**
 * Send a plain-text WhatsApp message via the Cloud API. Best-effort: never
 * throws — returns a result the caller can log. `to` is the recipient wa_id
 * (international format, no "+").
 */
export async function sendTextMessage(to: string, body: string): Promise<SendResult> {
  const config = await getWhatsAppConfig();
  if (!config.phoneNumberId || !config.accessToken) {
    return { ok: false, reason: "not-configured" };
  }

  const endpoint = `https://graph.facebook.com/${config.graphVersion}/${encodeURIComponent(
    config.phoneNumberId,
  )}/messages`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WA_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: body.slice(0, 4096) },
      }),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as {
      messages?: { id?: string }[];
      error?: { message?: string };
    };
    const messageId = data.messages?.[0]?.id;
    if (!res.ok || !messageId) {
      return {
        ok: false,
        reason: "error",
        error: data.error?.message ?? `WhatsApp returned ${res.status}`,
      };
    }
    await captureOutboundMessage({
      to,
      body: body.slice(0, 4096),
      messageId,
      phoneNumberId: config.phoneNumberId,
    });
    return { ok: true, messageId };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "WhatsApp send timed out"
        : err instanceof Error
          ? err.message
          : "Unknown WhatsApp error";
    return { ok: false, reason: "error", error: message };
  } finally {
    clearTimeout(timer);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

import { NextResponse, type NextRequest } from "next/server";
import {
  captureInboundMessage,
  getWhatsAppConfig,
  parseInboundMessages,
  sendTextMessage,
  verifyWebhookSignature,
  verifyWebhookSubscription,
  type InboundMessage,
} from "@/lib/whatsapp";

/**
 * WhatsApp Cloud API webhook callback.
 *
 * Configure this URL (https://<your-domain>/api/whatsapp) as the Callback URL in
 * the Meta App dashboard → WhatsApp → Configuration, with the same Verify Token
 * you set in Site Settings → WhatsApp.
 *
 * GET  — subscription handshake. Meta sends hub.mode/hub.verify_token/hub.challenge;
 *        we echo the challenge (as plain text) when the verify token matches.
 * POST — message + status notifications. We verify the X-Hub-Signature-256 HMAC
 *        over the raw body using the app secret, parse inbound messages, and ACK
 *        with 200 immediately (Meta retries on non-2xx, so handling must be fast
 *        and must not surface errors as a non-2xx response).
 */

// Reads request-specific headers/body and hits external APIs — never cache.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const config = await getWhatsAppConfig();
  const params = request.nextUrl.searchParams;

  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = verifyWebhookSubscription(config, {
    mode,
    token,
    challenge: params.get("hub.challenge"),
  });

  if (challenge === null) {
    console.warn(
      `WhatsApp webhook verification failed: mode=${mode ?? "<none>"} ` +
        `verifyTokenConfigured=${Boolean(config.verifyToken)} ` +
        `tokenMatched=${Boolean(token && config.verifyToken && token === config.verifyToken)}`,
    );
    return new NextResponse("Forbidden", { status: 403 });
  }
  console.info("WhatsApp webhook verified (subscription handshake succeeded).");
  // Meta expects the raw challenge string echoed back verbatim.
  return new NextResponse(challenge, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

export async function POST(request: NextRequest) {
  const config = await getWhatsAppConfig();

  // Read the RAW body — signature verification must run over the exact bytes
  // Meta signed, so we cannot use request.json() first.
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(config, rawBody, signature)) {
    console.warn(
      `WhatsApp webhook signature rejected: appSecretConfigured=${Boolean(config.appSecret)} ` +
        `signatureHeaderPresent=${Boolean(signature)} bodyBytes=${rawBody.length}`,
    );
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Still ACK so Meta doesn't retry a payload we'll never parse.
    return NextResponse.json({ ok: true, ignored: "invalid-json" });
  }

  const messages = parseInboundMessages(payload);
  // Handle messages best-effort. Failures are logged, never bubbled into the
  // response — a non-2xx would make Meta redeliver the same notification.
  for (const message of messages) {
    try {
      // Capture every message first — this is the system of record, independent
      // of whether auto-reply is enabled.
      await captureInboundMessage(message);
      await handleInboundMessage(config.enabled, message);
    } catch (err) {
      console.warn("WhatsApp message handling failed:", err);
    }
  }

  return NextResponse.json({ ok: true, received: messages.length });
}

/**
 * Process a single inbound message. The default behaviour is a lightweight
 * auto-reply acknowledging receipt; extend this to route messages into product
 * logic (subscriptions, support, notifications opt-in, etc.). Replies are only
 * sent when the integration is enabled in Site Settings.
 */
async function handleInboundMessage(enabled: boolean, message: InboundMessage): Promise<void> {
  if (!message.from) return;
  console.info(`WhatsApp inbound (${message.type}) from ${message.from}: ${message.text}`);

  if (!enabled) return;

  const reply =
    "Thanks for messaging FamilyPulse! We've received your message and will get back to you soon.";
  const result = await sendTextMessage(message.from, reply);
  if (!result.ok) {
    console.warn(`WhatsApp auto-reply failed for ${message.from}: ${result.error ?? result.reason}`);
  }
}

import "server-only";
import { Resend } from "resend";
import { getSettings } from "@/lib/settings";

/**
 * Transactional email via Resend.
 *
 * The API key and default From address are resolved from site settings
 * (database value, falling back to `RESEND_API_KEY` / `EMAIL_FROM` in the
 * environment). The client is created per-call so importing this module never
 * throws when the key is absent; `sendEmail` rejects at call time instead.
 */

export const FALLBACK_FROM = "FamilyPulse <no-reply@familypulse.com>";

async function getResend(): Promise<Resend> {
  const { RESEND_API_KEY } = await getSettings();
  if (!RESEND_API_KEY) {
    throw new Error("Resend API key is not configured (set it in Site Settings or RESEND_API_KEY).");
  }
  return new Resend(RESEND_API_KEY);
}

/** Resolve the default From address from settings, falling back to a placeholder. */
export async function getEmailFrom(): Promise<string> {
  const { EMAIL_FROM } = await getSettings();
  return EMAIL_FROM ?? FALLBACK_FROM;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  /** HTML body. Provide this and/or `text`. */
  html?: string;
  /** Plain-text body. */
  text?: string;
  /** Override the default From address. */
  from?: string;
  replyTo?: string | string[];
}

/** Send a transactional email. Returns the Resend message id on success. */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: SendEmailOptions): Promise<string> {
  if (!html && !text) {
    throw new Error("sendEmail requires `html` or `text`");
  }

  const resend = await getResend();
  const fromAddress = from ?? (await getEmailFrom());

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    // Resend's types want at least one of html/text/react.
    ...(html ? { html } : { text: text as string }),
    ...(text && html ? { text } : {}),
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    throw new Error(`Resend: ${error.name} — ${error.message}`);
  }
  if (!data?.id) {
    throw new Error("Resend: no message id returned");
  }
  return data.id;
}

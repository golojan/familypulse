import { Resend } from "resend";

/**
 * Transactional email via Resend.
 *
 * Set `RESEND_API_KEY` and `EMAIL_FROM` in the environment. The client is
 * created lazily so importing this module never throws when the key is absent
 * (e.g. during builds); `sendEmail` will reject at call time instead.
 */

let client: Resend | null = null;

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

/** Default From address: `EMAIL_FROM`, falling back to a placeholder. */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "FamilyPulse <no-reply@familypulse.com>";

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
  from = EMAIL_FROM,
  replyTo,
}: SendEmailOptions): Promise<string> {
  if (!html && !text) {
    throw new Error("sendEmail requires `html` or `text`");
  }

  const { data, error } = await getResend().emails.send({
    from,
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

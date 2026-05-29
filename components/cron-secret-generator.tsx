"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import {
  generateCronSecret,
  type GenerateSecretState,
} from "@/app/admin/settings/actions";

const INITIAL: GenerateSecretState = { ok: false };

/**
 * Generates and stores a CRON_SECRET, then shows the plaintext once so the admin
 * can copy it into the host's CRON_SECRET environment variable. Kept separate
 * from the main settings form because it persists immediately (and forms can't
 * nest).
 */
export function CronSecretGenerator({ configured }: { configured: boolean }) {
  const [state, action] = useActionState(generateCronSecret, INITIAL);

  return (
    <section className="rounded-lg border border-fp-line bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-fp-green" />
        <h2 className="text-lg font-bold text-fp-ink">Cron Secret</h2>
      </div>
      <p className="mt-1 text-sm font-semibold text-fp-muted">
        Authorizes the scheduled AI draft job. Generate one here (stored encrypted), then
        set the same value as <code className="font-mono">CRON_SECRET</code> in your host&apos;s
        environment variables so Vercel Cron can call the endpoint.
        {configured ? " A secret is currently saved." : " No secret is saved yet."}
      </p>

      <form action={action} className="mt-4 grid gap-3">
        <GenerateButton hasExisting={configured} />
        {state.error ? (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-600" aria-live="polite">
            {state.error}
          </p>
        ) : null}
        {state.ok && state.secret ? <SecretReveal secret={state.secret} /> : null}
      </form>
    </section>
  );
}

function GenerateButton({ hasExisting }: { hasExisting: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-fit items-center gap-2 rounded-md bg-fp-green px-5 py-2.5 text-sm font-extrabold !text-white shadow-green disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Generating…" : hasExisting ? "Regenerate secret" : "Generate secret"}
    </button>
  );
}

function SecretReveal({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable; the value is shown for manual copy.
    }
  }

  return (
    <div className="grid gap-2 rounded-md border border-fp-green/30 bg-fp-green/5 p-4">
      <p className="text-xs font-extrabold uppercase text-fp-green">
        Copy this now — it won&apos;t be shown again
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all rounded bg-white px-3 py-2 font-mono text-xs text-fp-ink">
          {secret}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-fp-line bg-white px-3 py-2 text-xs font-extrabold text-fp-ink hover:bg-fp-mint"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-fp-green" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-xs font-semibold text-fp-muted">
        Set <code className="font-mono">CRON_SECRET</code> to this value in your host&apos;s
        environment and redeploy.
      </p>
    </div>
  );
}

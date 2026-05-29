"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";
import { generateNow, type GenerateState } from "@/app/dashboard/pulse-ai/actions";

const INITIAL: GenerateState = { ok: false };

export function GenerateDraftsButton({ disabled }: { disabled?: boolean }) {
  const [state, action] = useActionState(generateNow, INITIAL);

  return (
    <form action={action} className="grid gap-3">
      <SubmitButton disabled={disabled} />
      {state.error ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-600" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="rounded-md bg-fp-green/10 px-4 py-3 text-sm font-bold text-fp-green" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-fp-green px-6 text-sm font-extrabold !text-white shadow-green disabled:opacity-60"
    >
      <Sparkles className={`h-4 w-4 ${pending ? "animate-pulse" : ""}`} />
      {pending ? "Generating…" : "Generate drafts now"}
    </button>
  );
}

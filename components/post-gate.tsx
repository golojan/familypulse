"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { confirmSubscription, dismissGateAction } from "@/app/subscription-actions";

/**
 * The metered-paywall prompt shown in place of the rest of a post for
 * non-subscribed readers. Mirrors the Medium/Substack model:
 *  - "Subscribe": signed-out readers are sent to sign-in (returning here);
 *    signed-in readers get an explicit "Confirm subscription" step, then the
 *    full post is revealed.
 *  - "Subscribe later": records a per-post dismissal (cookie) so this post isn't
 *    gated again for this reader, but other posts still prompt.
 */
export function PostGate({
  postId,
  postSlug,
  isAuthenticated,
}: {
  postId: string;
  postSlug: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  // After signing in via "Subscribe", the reader returns with ?subscribe=1 and
  // is authenticated but not yet subscribed — jump straight to the confirm step.
  const [phase, setPhase] = useState<"prompt" | "confirm">(
    isAuthenticated && searchParams.get("subscribe") === "1" ? "confirm" : "prompt",
  );
  const [error, setError] = useState("");

  function goSignIn() {
    // Return to this post after auth; the gate then offers "Confirm".
    const callbackUrl = `/posts/${postSlug}?subscribe=1`;
    router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  function onSubscribe() {
    setError("");
    if (!isAuthenticated) {
      goSignIn();
      return;
    }
    setPhase("confirm");
  }

  function onConfirm() {
    setError("");
    startTransition(async () => {
      const result = await confirmSubscription(postSlug);
      if (result.ok) {
        router.refresh();
      } else if (result.reason === "unauthenticated") {
        goSignIn();
      } else {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  function onLater() {
    startTransition(async () => {
      await dismissGateAction(postId, postSlug);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      {/* Fade from the trimmed content above into the prompt. */}
      <div className="pointer-events-none absolute -top-28 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-white" />

      <div className="rounded-lg border border-fp-green/20 bg-fp-cream p-6 text-center shadow-card sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-fp-green shadow-soft">
          {phase === "confirm" ? <Mail className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
        </span>

        {phase === "confirm" ? (
          <>
            <h2 className="mt-5 text-2xl font-bold text-fp-ink">Confirm your subscription</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-fp-muted">
              Subscribe to FamilyPulse to read every article in full. It&apos;s free, and you
              won&apos;t be asked again.
            </p>
            {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-fp-green px-6 text-sm font-extrabold text-white shadow-green disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm subscription
              </button>
              <button
                type="button"
                onClick={() => setPhase("prompt")}
                disabled={pending}
                className="text-sm font-extrabold text-fp-muted hover:text-fp-green disabled:opacity-60"
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-5 text-2xl font-bold text-fp-ink">
              Keep reading — subscribe to FamilyPulse
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-fp-muted">
              Subscribe free to read this article in full and unlock every story on FamilyPulse. One
              subscription covers every post.
            </p>
            {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onSubscribe}
                disabled={pending}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-fp-green px-6 text-sm font-extrabold text-white shadow-green disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Subscribe to read
              </button>
              <button
                type="button"
                onClick={onLater}
                disabled={pending}
                className="text-sm font-extrabold text-fp-muted hover:text-fp-green disabled:opacity-60"
              >
                Subscribe later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

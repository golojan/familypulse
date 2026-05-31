"use server";

import { revalidatePath } from "next/cache";
import { dismissGate, subscribeCurrentUser } from "@/lib/subscription";

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "error" };

/**
 * Confirm the subscription for the currently signed-in reader. Called after the
 * reader has authenticated (Subscribe → sign in → Confirm). If somehow not
 * signed in, returns "unauthenticated" so the UI can route to sign-in again.
 */
export async function confirmSubscription(postSlug?: string): Promise<SubscribeResult> {
  try {
    const ok = await subscribeCurrentUser();
    if (!ok) return { ok: false, reason: "unauthenticated" };
    // Reveal the now-ungated content on the page they're on (and the home rails).
    if (postSlug) revalidatePath(`/posts/${postSlug}`);
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Record a per-post "subscribe later" dismissal (30-day browser cookie). */
export async function dismissGateAction(postId: string, postSlug?: string): Promise<void> {
  await dismissGate(postId);
  if (postSlug) revalidatePath(`/posts/${postSlug}`);
}

import "server-only";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Reader subscription model for the metered post paywall.
 *
 * - Subscription is GLOBAL and tied to a signed-in account (`User.subscribedAt`).
 *   A subscriber sees full post bodies everywhere; a non-subscriber gets the
 *   gated preview (first couple of paragraphs + a subscribe prompt).
 * - "Subscribe later" is per-post and remembered in a browser cookie for 30 days,
 *   so the same reader isn't re-prompted on that post but can still be prompted
 *   on other posts.
 */

const DISMISS_COOKIE = "fp_gate_dismissed";
const DISMISS_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const DISMISS_LIMIT = 200; // cap stored ids so the cookie can't grow unbounded

/** Whether the current viewer is a subscribed (signed-in) reader. */
export async function isSubscribed(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscribedAt: true },
  });
  return Boolean(user?.subscribedAt);
}

/** Parse the dismissed-post-ids cookie into a Set. */
async function readDismissed(): Promise<Set<string>> {
  const store = await cookies();
  const raw = store.get(DISMISS_COOKIE)?.value;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** Whether this reader chose "subscribe later" on the given post. */
export async function hasDismissedGate(postId: string): Promise<boolean> {
  const dismissed = await readDismissed();
  return dismissed.has(postId);
}

/** Persist a "subscribe later" dismissal for a post (30-day browser cookie). */
export async function dismissGate(postId: string): Promise<void> {
  const dismissed = await readDismissed();
  dismissed.add(postId);
  // Keep only the most recent ids if we somehow exceed the cap.
  const ids = Array.from(dismissed).slice(-DISMISS_LIMIT);
  const store = await cookies();
  store.set(DISMISS_COOKIE, ids.join(","), {
    maxAge: DISMISS_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

/** Mark the current signed-in user as subscribed. Returns false if not signed in. */
export async function subscribeCurrentUser(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  await prisma.user.update({
    where: { id: session.user.id },
    data: { subscribedAt: new Date() },
  });
  return true;
}

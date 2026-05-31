import { NextResponse, type NextRequest } from "next/server";
import { generateDrafts, getDraftConfig, isIntervalElapsed } from "@/lib/ai-drafts";
import { getSetting } from "@/lib/settings";

/**
 * Scheduled AI draft generation endpoint.
 *
 * Invoked by Vercel Cron (see vercel.json) on a fixed clock schedule. The cron
 * runs frequently; the *effective* cadence is the admin-configured interval —
 * we run only when `AI_DRAFTS_ENABLED` is true and enough time has passed since
 * the last run (see lib/ai-drafts). This keeps the schedule editable from the
 * admin UI without redeploying.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. We require the
 * CRON_SECRET to be configured and to match, so the route can't be triggered by
 * the public. (Vercel also blocks external traffic to cron paths, but we don't
 * rely on that alone.)
 */

// Generation hits external APIs + the DB; never cache, always run on request.
export const dynamic = "force-dynamic";
// Each draft is a text-model call + an OpenAI image generation, run sequentially
// per draft — image generation alone can take 30–60s+. 60s is not enough; allow
// up to the platform max so a multi-draft run doesn't get killed mid-flight.
// (Vercel caps this at 300s on Pro/Fluid; Hobby allows 60s — keep AI_DRAFTS_PER_RUN
// low there. Per-call timeouts in lib/ai-drafts bound each external request.)
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Accept either the admin-managed secret (Site Settings, encrypted in the DB)
  // or the CRON_SECRET env var. getSetting resolves DB-then-env for this key.
  const secret = await getSetting("CRON_SECRET");
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured (Site Settings or env)." },
      { status: 500 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const config = await getDraftConfig();

  if (!config.enabled) {
    return NextResponse.json({ ok: true, skipped: "disabled" });
  }
  if (!(await isIntervalElapsed(config.intervalMinutes))) {
    return NextResponse.json({ ok: true, skipped: "interval-not-elapsed" });
  }

  const result = await generateDrafts(config, "cron");
  return NextResponse.json({ ok: result.status !== "FAILED", ...result });
}

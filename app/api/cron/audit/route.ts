import { NextResponse, type NextRequest } from "next/server";
import { runAudit } from "@/lib/post-audit";
import { getSetting } from "@/lib/settings";

/**
 * Scheduled post-audit endpoint.
 *
 * Walks the post library a small batch per run (least-recently-audited first),
 * repairing structural issues and missing/broken cover images. Published posts
 * are unpublished, fixed, then re-published. See lib/post-audit for the logic.
 *
 * Auth mirrors the generate-drafts cron: requires `Authorization: Bearer
 * <CRON_SECRET>` (Site Settings or env). Optional `?batch=N` overrides how many
 * posts to process this run (default 5; clamped to 1–25).
 */

export const dynamic = "force-dynamic";
// Each post may trigger a cover-image generation (30–60s+); allow the platform
// max so a batch isn't killed mid-flight. Keep the batch small on Hobby (60s).
export const maxDuration = 300;

export async function GET(request: NextRequest) {
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

  const batchParam = Number.parseInt(request.nextUrl.searchParams.get("batch") ?? "", 10);
  const batchSize = Number.isFinite(batchParam) ? Math.min(25, Math.max(1, batchParam)) : undefined;

  const result = await runAudit("cron", batchSize);
  return NextResponse.json({ ok: result.status !== "FAILED", ...result });
}

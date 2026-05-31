import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, Clock, ExternalLink, ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDraftConfig } from "@/lib/ai-drafts";
import { GenerateDraftsButton } from "@/components/generate-drafts-button";

export const metadata = {
  title: "Pulse AI · FamilyPulse",
};

// Reads the latest run + live config; must never be statically cached.
export const dynamic = "force-dynamic";

export default async function PulseAiPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/dashboard/pulse-ai");
  }
  if (!session.user.roles?.includes("SUPERADMIN")) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-lg rounded-lg border border-fp-line bg-white p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Superadmin only</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-fp-muted">
            Pulse AI tools can only be used by a FamilyPulse superadmin.
          </p>
        </div>
      </main>
    );
  }

  const config = await getDraftConfig();
  const recentRuns = await prisma.aiDraftRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const hasKey = Boolean(config.apiKey);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-4xl gap-6">
        <div className="rounded-lg border border-fp-line bg-white p-8 shadow-card">
          <p className="text-sm font-extrabold uppercase text-fp-green">Pulse AI</p>
          <h1 className="mt-2 text-3xl font-bold">Automatic draft generator</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-fp-muted">
            On a schedule, Pulse AI writes new article drafts with{" "}
            {config.provider === "deepseek" ? "DeepSeek" : "Anthropic"} and saves them as
            <span className="font-extrabold"> drafts</span> for an editor to review and publish.
            Nothing is published automatically.
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <ConfigRow
              label="Schedule"
              ok={config.enabled}
              value={config.enabled ? "Enabled" : "Disabled"}
            />
            <ConfigRow
              label="API key"
              ok={hasKey}
              value={hasKey ? `${config.provider} configured` : `No ${config.provider} key`}
            />
            <ConfigRow label="Interval" ok value={`Every ${config.intervalMinutes} min`} />
            <ConfigRow
              label="Per run"
              ok
              value={`${config.perRun} draft${config.perRun === 1 ? "" : "s"}`}
            />
            <ConfigRow label="Model" ok value={config.model} />
            <ConfigRow label="Topic" ok value={config.topicSlug ?? "Rotating across all topics"} />
            <ConfigRow
              label="Cover images"
              ok={!config.coverImages || Boolean(config.openaiApiKey)}
              value={
                !config.coverImages
                  ? "Off"
                  : config.openaiApiKey
                    ? `On · ${config.openaiImageModel} · ${config.openaiImageQuality}`
                    : "On · no OpenAI key"
              }
            />
          </dl>

          <p className="mt-4 text-xs font-semibold text-fp-muted">
            Configure these in{" "}
            <Link href="/admin/settings" className="font-extrabold text-fp-green hover:underline">
              Site Settings → AI Draft Generator
            </Link>
            .
          </p>

          <div className="mt-6 border-t border-fp-line pt-6">
            <GenerateDraftsButton disabled={!hasKey} />
            {!hasKey ? (
              <p className="mt-3 text-xs font-bold text-amber-700">
                Add an API key for {config.provider} before generating.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-fp-line bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-bold">Recent runs</h2>
          {recentRuns.length === 0 ? (
            <p className="mt-3 text-sm font-semibold text-fp-muted">No runs yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {recentRuns.map((run) => (
                <li
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-fp-line/70 px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-fp-ink">
                    <RunBadge status={run.status} />
                    <span>
                      {run.created} draft{run.created === 1 ? "" : "s"}
                    </span>
                    <span className="text-fp-muted">
                      · {run.provider} · {run.trigger}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-fp-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {run.createdAt.toLocaleString()}
                  </div>
                  {run.detail ? (
                    <p className="w-full text-xs font-semibold text-amber-700">{run.detail}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-fp-green hover:underline"
          >
            Review drafts on the Posts dashboard <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function ConfigRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2.5">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-fp-green" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-fp-muted" />
      )}
      <span className="text-xs font-extrabold uppercase text-fp-muted">{label}</span>
      <span className="ml-auto truncate text-sm font-bold text-fp-ink">{value}</span>
    </div>
  );
}

function RunBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: "bg-fp-green/10 text-fp-green",
    PARTIAL: "bg-amber-100 text-amber-700",
    FAILED: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${map[status] ?? "bg-fp-line/60 text-fp-muted"}`}
    >
      {status}
    </span>
  );
}

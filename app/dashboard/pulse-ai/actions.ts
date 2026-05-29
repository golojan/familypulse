"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { generateDrafts, getDraftConfig } from "@/lib/ai-drafts";

export type GenerateState = {
  ok: boolean;
  message?: string;
  error?: string;
};

/** Only superadmins may trigger draft generation on demand. */
async function requireSuperadmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  if (!session.user.roles?.includes("SUPERADMIN")) throw new Error("FORBIDDEN");
}

/**
 * Manual "Generate now" trigger from the Pulse AI page. Bypasses the schedule
 * and the interval gate (an admin asking explicitly), but still requires an
 * API key for the configured provider and respects the per-run count. Drafts
 * are saved as DRAFT, same as the cron path.
 */
export async function generateNow(
  // Signature is fixed by React's useActionState; this action ignores its input.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: GenerateState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<GenerateState> {
  await requireSuperadmin();

  const config = await getDraftConfig();
  if (!config.apiKey) {
    return {
      ok: false,
      error: `No API key configured for ${config.provider}. Add one in Site Settings.`,
    };
  }

  const result = await generateDrafts(config, "manual");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pulse-ai");
  revalidatePath("/");

  if (result.status === "FAILED") {
    return { ok: false, error: result.detail ?? "Generation failed." };
  }

  const noun = result.created === 1 ? "draft" : "drafts";
  return {
    ok: true,
    message:
      result.status === "PARTIAL"
        ? `Created ${result.created} ${noun}, with some errors: ${result.detail}`
        : `Created ${result.created} ${noun}. Review them on the Posts dashboard.`,
  };
}

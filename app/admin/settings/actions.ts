"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret, hasEncryptionKey } from "@/lib/crypto";
import {
  SETTING_FIELDS,
  SETTINGS_CACHE_TAG,
  type SettingKey,
} from "@/lib/settings";

export type SettingsActionState = {
  ok: boolean;
  error?: string;
  savedAt?: number;
};

/** Only superadmins may read or write site settings. */
async function requireSuperadmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  if (!session.user.roles?.includes("SUPERADMIN")) throw new Error("FORBIDDEN");
}

/**
 * Persist submitted settings.
 *
 * Field semantics:
 * - Non-secret field: the submitted value replaces the stored one (blank clears it).
 * - Secret field: blank means "leave unchanged" (we never echo secrets back, so a
 *   blank submit must not wipe them). To remove a secret, the matching
 *   `clear:<KEY>` checkbox is sent.
 * Secret values are encrypted before storage.
 */
export async function saveSettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireSuperadmin();

  if (!hasEncryptionKey()) {
    return {
      ok: false,
      error: "SETTINGS_ENCRYPTION_KEY is not set on the server — cannot store secrets securely.",
    };
  }

  const upserts: Array<Promise<unknown>> = [];

  for (const field of SETTING_FIELDS) {
    const raw = formData.get(field.key);
    const value = typeof raw === "string" ? raw.trim() : "";
    const clearRequested = formData.get(`clear:${field.key}`) === "on";

    if (field.secret) {
      if (clearRequested) {
        upserts.push(deleteSetting(field.key));
        continue;
      }
      if (value === "") {
        // Blank secret submit → keep whatever is stored.
        continue;
      }
      upserts.push(writeSetting(field.key, encryptSecret(value), true));
    } else {
      if (value === "") {
        upserts.push(deleteSetting(field.key));
      } else {
        upserts.push(writeSetting(field.key, value, false));
      }
    }
  }

  try {
    await Promise.all(upserts);
  } catch {
    return { ok: false, error: "Could not save one or more settings. Please try again." };
  }

  // Bust the cached settings so auth/email/storage pick up the new values.
  revalidateTag(SETTINGS_CACHE_TAG, "max");
  revalidatePath("/admin/settings");

  return { ok: true, savedAt: Date.now() };
}

export type GenerateSecretState = {
  ok: boolean;
  error?: string;
  /** The freshly generated plaintext, shown once so the admin can copy it to env. */
  secret?: string;
};

/**
 * Generate a strong CRON_SECRET, store it encrypted, and return the plaintext
 * once. The admin copies it into the host's CRON_SECRET env var so Vercel Cron
 * and the saved value match. Superadmin-only; requires the encryption key.
 */
export async function generateCronSecret(
  // Signature is fixed by React's useActionState; this action ignores its input.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: GenerateSecretState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<GenerateSecretState> {
  await requireSuperadmin();
  if (!hasEncryptionKey()) {
    return { ok: false, error: "SETTINGS_ENCRYPTION_KEY is not set — cannot store the secret securely." };
  }

  const secret = randomBytes(32).toString("base64url");
  try {
    await writeSetting("CRON_SECRET", encryptSecret(secret), true);
  } catch {
    return { ok: false, error: "Could not save the generated secret. Please try again." };
  }

  revalidateTag(SETTINGS_CACHE_TAG, "max");
  revalidatePath("/admin/settings");
  return { ok: true, secret };
}

function writeSetting(key: SettingKey, value: string, encrypted: boolean) {
  return prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, encrypted },
    update: { value, encrypted },
  });
}

function deleteSetting(key: SettingKey) {
  return prisma.siteSetting.deleteMany({ where: { key } });
}

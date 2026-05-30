import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import {
  SETTING_FIELDS,
  SETTING_KEYS,
  SETTINGS_CACHE_TAG,
  type SettingKey,
  type SettingStatus,
} from "@/lib/settings-catalog";

/**
 * Server-side site settings resolution.
 *
 * Field/group definitions live in the client-safe `lib/settings-catalog`. This
 * module adds the database-backed resolution: for each key the effective value
 * is the DB value (decrypted if secret) with a `process.env` fallback. This lets
 * the system run on `.env` out of the box and switch to DB-managed config as a
 * superadmin fills it in, with no changes at the call sites (auth/email/storage).
 */

// Re-export the catalog so existing server-side imports of "@/lib/settings" keep working.
export * from "@/lib/settings-catalog";

export type ResolvedSettings = Record<SettingKey, string | undefined>;

/**
 * Reads the raw DB rows (cached + tagged). Decryption happens after this layer
 * so the encryption key is never captured inside the cache closure.
 */
const readRows = unstable_cache(
  async () => {
    return prisma.siteSetting.findMany({
      select: { key: true, value: true, encrypted: true },
    });
  },
  ["site-settings-rows"],
  { tags: [SETTINGS_CACHE_TAG] },
);

/**
 * Resolve every setting to its effective value: DB (decrypted if secret) with
 * an `.env` fallback. Missing/blank values resolve to `undefined`.
 */
export async function getSettings(): Promise<ResolvedSettings> {
  const rows = await readRows();
  const byKey = new Map(rows.map((r) => [r.key, r] as const));

  const resolved = {} as ResolvedSettings;
  for (const key of SETTING_KEYS) {
    const row = byKey.get(key);
    let value: string | undefined;

    if (row?.value) {
      value = row.encrypted ? (decryptSecret(row.value) ?? undefined) : row.value;
    }
    // Fall back to the environment when there's no usable DB value.
    if (value === undefined || value === "") {
      const envValue = process.env[key];
      value = envValue && envValue !== "" ? envValue : undefined;
    }
    resolved[key] = value;
  }
  return resolved;
}

/** Resolve a single setting. Convenience wrapper over {@link getSettings}. */
export async function getSetting(key: SettingKey): Promise<string | undefined> {
  const all = await getSettings();
  return all[key];
}

/**
 * Per-field status for the admin UI: whether each setting is configured, where
 * it resolves from, and (for non-secrets) the current value. Secret values are
 * never sent to the client — only whether one exists.
 */
export async function getSettingsStatus(): Promise<Record<SettingKey, SettingStatus>> {
  const rows = await readRows();
  const byKey = new Map(rows.map((r) => [r.key, r] as const));

  const out = {} as Record<SettingKey, SettingStatus>;
  for (const field of SETTING_FIELDS) {
    const row = byKey.get(field.key);
    const dbValue = row?.value && row.encrypted ? decryptSecret(row.value) : (row?.value ?? null);
    const hasDbValue = Boolean(dbValue && dbValue !== "");
    const envValue = process.env[field.key];
    const hasEnvValue = Boolean(envValue && envValue !== "");

    out[field.key] = {
      key: field.key,
      configured: hasDbValue || hasEnvValue,
      fromDatabase: hasDbValue,
      displayValue: field.secret
        ? null
        : hasDbValue
          ? (dbValue as string)
          : hasEnvValue
            ? (envValue as string)
            : null,
    };
  }
  return out;
}

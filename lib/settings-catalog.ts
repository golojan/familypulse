export type SettingKey =
  | "AUTH_GOOGLE_ID"
  | "AUTH_GOOGLE_SECRET"
  | "RESEND_API_KEY"
  | "EMAIL_FROM"
  | "DO_SPACES_REGION"
  | "DO_SPACES_ENDPOINT"
  | "DO_SPACES_BUCKET"
  | "DO_SPACES_KEY"
  | "DO_SPACES_SECRET"
  | "DO_SPACES_CDN_ENDPOINT";

export type SettingField = {
  key: SettingKey;
  label: string;
  secret: boolean;
  placeholder?: string;
  help?: string;
};

export type SettingGroup = {
  id: string;
  title: string;
  description: string;
  fields: SettingField[];
};

export type SettingStatus = {
  key: SettingKey;
  configured: boolean;
  fromDatabase: boolean;
  displayValue: string | null;
};

export const SETTING_GROUPS: SettingGroup[] = [
  {
    id: "auth",
    title: "Authentication Providers",
    description: "Google OAuth credentials used for social sign-in.",
    fields: [
      {
        key: "AUTH_GOOGLE_ID",
        label: "Google Client ID",
        secret: false,
        placeholder: "xxxxxxxx.apps.googleusercontent.com",
      },
      { key: "AUTH_GOOGLE_SECRET", label: "Google Client Secret", secret: true },
    ],
  },
  {
    id: "email",
    title: "Resend Email API",
    description: "Transactional email delivery (magic links, notifications).",
    fields: [
      { key: "RESEND_API_KEY", label: "Resend API Key", secret: true, placeholder: "re_..." },
      {
        key: "EMAIL_FROM",
        label: "From Address",
        secret: false,
        placeholder: "FamilyPulse <no-reply@familypulse.com>",
      },
    ],
  },
  {
    id: "storage",
    title: "Digital Ocean Storage",
    description: "S3-compatible Spaces bucket for media uploads.",
    fields: [
      { key: "DO_SPACES_REGION", label: "Region", secret: false, placeholder: "fra1" },
      {
        key: "DO_SPACES_ENDPOINT",
        label: "Endpoint",
        secret: false,
        placeholder: "https://fra1.digitaloceanspaces.com",
      },
      { key: "DO_SPACES_BUCKET", label: "Bucket", secret: false },
      { key: "DO_SPACES_KEY", label: "Access Key", secret: true },
      { key: "DO_SPACES_SECRET", label: "Secret Key", secret: true },
      {
        key: "DO_SPACES_CDN_ENDPOINT",
        label: "CDN Endpoint",
        secret: false,
        placeholder: "https://cdn.example.com (optional)",
      },
    ],
  },
];

export const SETTING_FIELDS: SettingField[] = SETTING_GROUPS.flatMap((group) => group.fields);
export const SETTING_KEYS: SettingKey[] = SETTING_FIELDS.map((field) => field.key);

const FIELD_BY_KEY = new Map(SETTING_FIELDS.map((f) => [f.key, f] as const));

export function getSettingField(key: SettingKey): SettingField | undefined {
  return FIELD_BY_KEY.get(key);
}

/** Cache tag used to invalidate the resolved settings after a save. */
export const SETTINGS_CACHE_TAG = "site-settings";

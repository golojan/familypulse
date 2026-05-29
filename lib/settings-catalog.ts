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
  | "DO_SPACES_CDN_ENDPOINT"
  | "AI_DRAFTS_ENABLED"
  | "AI_DRAFTS_PROVIDER"
  | "AI_DRAFTS_INTERVAL_MINUTES"
  | "AI_DRAFTS_PER_RUN"
  | "AI_DRAFTS_TOPIC_SLUG"
  | "ANTHROPIC_API_KEY"
  | "ANTHROPIC_MODEL"
  | "DEEPSEEK_API_KEY"
  | "DEEPSEEK_MODEL"
  | "OPENAI_API_KEY"
  | "OPENAI_IMAGE_MODEL"
  | "AI_DRAFTS_COVER_IMAGES"
  | "CRON_SECRET";

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
  {
    id: "ai-drafts",
    title: "AI Draft Generator",
    description:
      "Automatically create post drafts on a schedule using DeepSeek or Anthropic. Generated posts are always saved as DRAFT for an editor to review and publish.",
    fields: [
      {
        key: "AI_DRAFTS_ENABLED",
        label: "Enabled",
        secret: false,
        placeholder: "true",
        help: "Set to \"true\" to let the scheduled job run. Any other value (or blank) keeps it off.",
      },
      {
        key: "AI_DRAFTS_PROVIDER",
        label: "Text Provider",
        secret: false,
        placeholder: "anthropic",
        help: "Which model writes the article: \"anthropic\" or \"deepseek\". Cover images always use OpenAI.",
      },
      {
        key: "AI_DRAFTS_INTERVAL_MINUTES",
        label: "Interval (minutes)",
        secret: false,
        placeholder: "60",
        help: "Minimum minutes between runs. The cron job checks this gate before generating.",
      },
      {
        key: "AI_DRAFTS_PER_RUN",
        label: "Drafts per run",
        secret: false,
        placeholder: "1",
        help: "How many draft posts to create each run (1–5).",
      },
      {
        key: "AI_DRAFTS_TOPIC_SLUG",
        label: "Topic slug (optional)",
        secret: false,
        placeholder: "communication",
        help: "Restrict generation to one topic by slug. Leave blank to rotate across all topics.",
      },
      { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", secret: true, placeholder: "sk-ant-..." },
      {
        key: "ANTHROPIC_MODEL",
        label: "Anthropic Model",
        secret: false,
        placeholder: "claude-opus-4-8",
        help: "Defaults to claude-opus-4-8 when blank.",
      },
      { key: "DEEPSEEK_API_KEY", label: "DeepSeek API Key", secret: true, placeholder: "sk-..." },
      {
        key: "DEEPSEEK_MODEL",
        label: "DeepSeek Model",
        secret: false,
        placeholder: "deepseek-chat",
        help: "Defaults to deepseek-chat when blank.",
      },
      {
        key: "AI_DRAFTS_COVER_IMAGES",
        label: "Generate cover images",
        secret: false,
        placeholder: "true",
        help: "Set to \"true\" to generate a cover image for each draft with OpenAI. Requires an OpenAI key.",
      },
      { key: "OPENAI_API_KEY", label: "OpenAI API Key", secret: true, placeholder: "sk-..." },
      {
        key: "OPENAI_IMAGE_MODEL",
        label: "OpenAI Image Model",
        secret: false,
        placeholder: "gpt-image-1",
        help: "Defaults to gpt-image-1 when blank.",
      },
    ],
  },
  {
    id: "cron",
    title: "Scheduled Jobs",
    description:
      "Secret shared with Vercel Cron to authorize the scheduled AI draft generator. Generate one here, then set the same value as the CRON_SECRET environment variable in your host (Vercel → Settings → Environment Variables).",
    fields: [
      {
        key: "CRON_SECRET",
        label: "Cron Secret",
        secret: true,
        help: "Use \"Generate\" to create a strong secret. The cron endpoint accepts this value or the CRON_SECRET env var.",
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

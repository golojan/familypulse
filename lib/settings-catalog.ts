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
  | "OPENAI_IMAGE_QUALITY"
  | "AI_DRAFTS_IMAGE_PROVIDER"
  | "GEMINI_API_KEY"
  | "GEMINI_IMAGE_MODEL"
  | "AI_DRAFTS_COVER_IMAGES"
  | "ADSENSE_CLIENT_ID"
  | "ADSENSE_AUTO_ADS"
  | "FACEBOOK_AUTOPOST_ENABLED"
  | "FACEBOOK_PAGE_ID"
  | "FACEBOOK_PAGE_ACCESS_TOKEN"
  | "FACEBOOK_GRAPH_VERSION"
  | "WHATSAPP_ENABLED"
  | "WHATSAPP_PHONE_NUMBER_ID"
  | "WHATSAPP_ACCESS_TOKEN"
  | "WHATSAPP_VERIFY_TOKEN"
  | "WHATSAPP_APP_SECRET"
  | "WHATSAPP_GRAPH_VERSION"
  | "CRON_SECRET";

export type SettingOption = { value: string; label: string };

export type SettingField = {
  key: SettingKey;
  label: string;
  secret: boolean;
  placeholder?: string;
  help?: string;
  /** When set, the field renders as a <select> with these choices instead of a
   * free-text input. The first option is treated as the default/blank value. */
  options?: SettingOption[];
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
        options: [
          { value: "false", label: "Off" },
          { value: "true", label: "On" },
        ],
        help: "When On, the scheduled job may run (subject to the interval below).",
      },
      {
        key: "AI_DRAFTS_PROVIDER",
        label: "Text Provider",
        secret: false,
        options: [
          { value: "anthropic", label: "Anthropic (Claude)" },
          { value: "deepseek", label: "DeepSeek" },
        ],
        help: "Which service writes the article. Cover images use the image provider selected below.",
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
      {
        key: "ANTHROPIC_API_KEY",
        label: "Anthropic API Key",
        secret: true,
        placeholder: "sk-ant-...",
      },
      {
        key: "ANTHROPIC_MODEL",
        label: "Anthropic Model",
        secret: false,
        options: [
          { value: "", label: "Default (claude-opus-4-8)" },
          { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
          { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
          { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
        ],
        help: "Used when the text provider is Anthropic.",
      },
      { key: "DEEPSEEK_API_KEY", label: "DeepSeek API Key", secret: true, placeholder: "sk-..." },
      {
        key: "DEEPSEEK_MODEL",
        label: "DeepSeek Model",
        secret: false,
        options: [
          { value: "", label: "Default (deepseek-chat)" },
          { value: "deepseek-chat", label: "deepseek-chat (V3)" },
          { value: "deepseek-reasoner", label: "deepseek-reasoner (R1)" },
        ],
        help: "Used when the text provider is DeepSeek. (DeepSeek is text-only — it cannot generate images.)",
      },
      {
        key: "AI_DRAFTS_COVER_IMAGES",
        label: "Generate cover images",
        secret: false,
        options: [
          { value: "false", label: "Off" },
          { value: "true", label: "On" },
        ],
        help: "When On, each draft gets an AI cover image. Requires a key for the selected image provider.",
      },
      {
        key: "AI_DRAFTS_IMAGE_PROVIDER",
        label: "Image Provider",
        secret: false,
        options: [
          { value: "openai", label: "OpenAI" },
          { value: "gemini", label: "Google Gemini" },
        ],
        help: "Which service generates cover images. (DeepSeek is not available — it has no image API.)",
      },
      { key: "OPENAI_API_KEY", label: "OpenAI API Key", secret: true, placeholder: "sk-..." },
      {
        key: "OPENAI_IMAGE_MODEL",
        label: "OpenAI Image Model",
        secret: false,
        options: [
          { value: "", label: "Default (gpt-image-1)" },
          { value: "gpt-image-1", label: "gpt-image-1 (photorealistic)" },
        ],
        help: "Used when the image provider is OpenAI.",
      },
      {
        key: "OPENAI_IMAGE_QUALITY",
        label: "OpenAI Image Quality",
        secret: false,
        options: [
          { value: "medium", label: "Medium (default)" },
          { value: "low", label: "Low (fastest, cheapest)" },
          { value: "high", label: "High (most detail, slower)" },
          { value: "auto", label: "Auto" },
        ],
        help: "Higher quality = more detail but slower and pricier.",
      },
      { key: "GEMINI_API_KEY", label: "Gemini API Key", secret: true, placeholder: "AIza..." },
      {
        key: "GEMINI_IMAGE_MODEL",
        label: "Gemini Image Model",
        secret: false,
        options: [
          { value: "", label: "Default (gemini-2.5-flash-image)" },
          { value: "gemini-2.5-flash-image", label: "gemini-2.5-flash-image (Nano Banana)" },
        ],
        help: "Used when the image provider is Google Gemini.",
      },
    ],
  },
  {
    id: "advertising",
    title: "Advertising",
    description:
      "Google AdSense settings. The Publisher ID powers both the in-post Advert block (AdSense format) and site-wide Auto ads. Leave the Publisher ID blank to disable all AdSense.",
    fields: [
      {
        key: "ADSENSE_CLIENT_ID",
        label: "AdSense Publisher ID",
        secret: false,
        placeholder: "ca-pub-XXXXXXXXXXXXXXXX",
        help: "Your AdSense client id (starts with ca-pub-). Required for any AdSense ads to render.",
      },
      {
        key: "ADSENSE_AUTO_ADS",
        label: "Auto ads (site-wide)",
        secret: false,
        options: [
          { value: "false", label: "Off" },
          { value: "true", label: "On" },
        ],
        help: "When On, Google Auto ads run across all public pages (AdSense decides ad placement). Also enable Auto ads for this site in your AdSense console. Requires a Publisher ID.",
      },
    ],
  },
  {
    id: "facebook",
    title: "Facebook Auto-post",
    description:
      "Automatically share posts to a Facebook Page when they are first published. Requires a Facebook Page and a long-lived Page Access Token (create these in Meta for Developers). Posts are shared as link posts so Facebook shows the cover image and title.",
    fields: [
      {
        key: "FACEBOOK_AUTOPOST_ENABLED",
        label: "Auto-post on publish",
        secret: false,
        options: [
          { value: "false", label: "Off" },
          { value: "true", label: "On" },
        ],
        help: "When On, each post is shared to the Facebook Page the first time it is published. Requires a Page ID and access token.",
      },
      {
        key: "FACEBOOK_PAGE_ID",
        label: "Facebook Page ID",
        secret: false,
        placeholder: "1234567890",
        help: "The numeric id of the Facebook Page to post to.",
      },
      {
        key: "FACEBOOK_PAGE_ACCESS_TOKEN",
        label: "Page Access Token",
        secret: true,
        placeholder: "EAA...",
        help: "A long-lived Page Access Token with pages_manage_posts permission. Stored encrypted.",
      },
      {
        key: "FACEBOOK_GRAPH_VERSION",
        label: "Graph API Version",
        secret: false,
        placeholder: "v25.0",
        help: "Facebook Graph API version. Defaults to v25.0 when blank.",
      },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp Messaging",
    description:
      "WhatsApp Cloud API webhook + messaging. Set the Callback URL in Meta (App → WhatsApp → Configuration) to https://<your-domain>/api/whatsapp, using the Verify Token below. The App Secret is used to validate incoming webhook signatures; the Access Token + Phone Number ID are used to send replies.",
    fields: [
      {
        key: "WHATSAPP_ENABLED",
        label: "Auto-reply enabled",
        secret: false,
        options: [
          { value: "false", label: "Off" },
          { value: "true", label: "On" },
        ],
        help: "When On, inbound messages receive an automatic acknowledgement reply. The webhook still verifies and logs messages when Off.",
      },
      {
        key: "WHATSAPP_PHONE_NUMBER_ID",
        label: "Phone Number ID",
        secret: false,
        placeholder: "1234567890",
        help: "The WhatsApp Cloud API phone number id (not the phone number itself) used to send messages.",
      },
      {
        key: "WHATSAPP_ACCESS_TOKEN",
        label: "Access Token",
        secret: true,
        placeholder: "EAA...",
        help: "A System User or long-lived access token with whatsapp_business_messaging permission. Stored encrypted.",
      },
      {
        key: "WHATSAPP_VERIFY_TOKEN",
        label: "Webhook Verify Token",
        secret: true,
        help: "An arbitrary string you choose. Enter the SAME value in Meta's webhook configuration so the GET handshake succeeds. Stored encrypted.",
      },
      {
        key: "WHATSAPP_APP_SECRET",
        label: "App Secret",
        secret: true,
        help: "Your Meta App Secret. Used to verify the X-Hub-Signature-256 on incoming webhooks. Required — webhooks are rejected when unset. Stored encrypted.",
      },
      {
        key: "WHATSAPP_GRAPH_VERSION",
        label: "Graph API Version",
        secret: false,
        placeholder: "v25.0",
        help: "Facebook Graph API version. Defaults to v25.0 when blank.",
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
        help: 'Use "Generate" to create a strong secret. The cron endpoint accepts this value or the CRON_SECRET env var.',
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

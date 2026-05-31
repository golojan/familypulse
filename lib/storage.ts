import "server-only";
import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";
import { getSettings } from "@/lib/settings";

/**
 * DigitalOcean Spaces (S3-compatible) client + presigned PUT URL helper.
 *
 * Browser uploads directly to Spaces using the signed URL — the server only
 * signs, never streams the bytes. Objects are made publicly readable by the
 * Space's bucket policy (PublicReadGetObject), NOT by a per-object ACL, so the
 * presigned PUTs intentionally do not sign an `x-amz-acl` header (the browser
 * sends only Content-Type, and a signed-but-unsent ACL silently stores the
 * object private). Configuration is resolved from site settings (database
 * values, falling back to the matching DO_SPACES_* env vars):
 *   DO_SPACES_REGION         (e.g. fra1)
 *   DO_SPACES_ENDPOINT       (origin URL)
 *   DO_SPACES_BUCKET
 *   DO_SPACES_KEY / DO_SPACES_SECRET
 *   DO_SPACES_CDN_ENDPOINT   (optional CDN URL; falls back to origin)
 */

type SpacesConfig = {
  client: S3Client;
  bucket: string;
  endpoint: string;
  cdnEndpoint: string | null;
};

/**
 * Build a Spaces client + config from current settings. Resolved per call so
 * credentials changed in Site Settings take effect without a restart. Throws if
 * the required values are missing.
 */
async function getSpaces(): Promise<SpacesConfig> {
  const s = await getSettings();
  const region = s.DO_SPACES_REGION ?? "fra1";
  const endpoint = s.DO_SPACES_ENDPOINT ?? `https://${region}.digitaloceanspaces.com`;

  if (!s.DO_SPACES_KEY || !s.DO_SPACES_SECRET) {
    throw new Error(
      "DigitalOcean Spaces credentials are not configured (Site Settings or DO_SPACES_*).",
    );
  }
  if (!s.DO_SPACES_BUCKET) {
    throw new Error(
      "DigitalOcean Spaces bucket is not configured (Site Settings or DO_SPACES_BUCKET).",
    );
  }

  return {
    client: new S3Client({
      region,
      endpoint,
      forcePathStyle: false,
      credentials: {
        accessKeyId: s.DO_SPACES_KEY,
        secretAccessKey: s.DO_SPACES_SECRET,
      },
    }),
    bucket: s.DO_SPACES_BUCKET,
    endpoint,
    cdnEndpoint: s.DO_SPACES_CDN_ENDPOINT ?? null,
  };
}

/** Public URL for a stored object — CDN if configured, else the Spaces origin. */
function buildPublicUrl(cfg: SpacesConfig, key: string): string {
  const base =
    cfg.cdnEndpoint?.replace(/\/+$/, "") || `${cfg.endpoint.replace(/\/+$/, "")}/${cfg.bucket}`;
  return `${base}/${key.replace(/^\/+/, "")}`;
}

/** Public URL for a stored object, resolved from current settings. */
export async function publicUrl(key: string): Promise<string> {
  const cfg = await getSpaces();
  return buildPublicUrl(cfg, key);
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_CAMPAIGN_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const ALLOWED_MESSAGE_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "video/mp4",
  "video/webm",
]);
const ALLOWED_LIBRARY_MEDIA_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/x-mpeg",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);
const ALLOWED_CAMPAIGN_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/x-mpeg",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);
const CAMPAIGN_MEDIA_TYPES_BY_CATEGORY: Record<string, Set<string>> = {
  PHOTOS: new Set(["image/jpeg", "image/png", "image/webp"]),
  JINGLES: new Set([
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/webm",
    "audio/x-mpeg",
  ]),
  VIDEOS: new Set(["video/mp4", "video/webm"]),
  BANNERS: new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  FLIERS: new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  DOCUMENTS: new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
};
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_GROUP_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_MESSAGE_MEDIA_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_LIBRARY_MEDIA_BYTES = 250 * 1024 * 1024; // 250 MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/mp3": "mp3",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/x-mpeg": "mp3",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
};

export interface PresignedUpload {
  /** PUT this URL with the file body and the same Content-Type. */
  uploadUrl: string;
  /** The final object key in the bucket. */
  key: string;
  /** Public URL where the object will be reachable after the upload completes. */
  publicUrl: string;
  /** Content-Type the client must send on PUT. */
  contentType: string;
  /** Maximum bytes accepted by the server's policy. */
  maxBytes: number;
  /** Seconds the URL stays valid. */
  expiresIn: number;
}

/**
 * Mint a presigned PUT URL for a user's avatar upload.
 * Throws if the content-type/size are out of policy.
 */
export async function presignAvatarUpload(opts: {
  userId: string;
  contentType: string;
  size: number;
}): Promise<PresignedUpload> {
  if (!ALLOWED_IMAGE_TYPES.has(opts.contentType)) {
    throw new Error(`Unsupported image type: ${opts.contentType}`);
  }
  if (opts.size <= 0 || opts.size > MAX_AVATAR_BYTES) {
    throw new Error(`File too large (max ${MAX_AVATAR_BYTES / 1024 / 1024}MB)`);
  }

  const ext = EXT_BY_TYPE[opts.contentType];
  const id = randomBytes(12).toString("hex");
  const key = `avatars/${opts.userId}/${id}.${ext}`;

  const cfg = await getSpaces();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    // Objects are served publicly via the Space's bucket policy, so we do NOT
    // sign an ACL header here: the browser PUTs with only Content-Type, and a
    // signed `x-amz-acl` it doesn't replay would make the object upload private.
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60; // 1 minute is plenty for an avatar upload
  const uploadUrl = await getSignedUrl(cfg.client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: buildPublicUrl(cfg, key),
    contentType: opts.contentType,
    maxBytes: MAX_AVATAR_BYTES,
    expiresIn,
  };
}

/**
 * Mint a presigned PUT URL for a group logo/avatar upload.
 * For new groups, the object is scoped to the creator until the group exists.
 */
export async function presignGroupLogoUpload(opts: {
  userId: string;
  groupId?: string;
  contentType: string;
  size: number;
}): Promise<PresignedUpload> {
  if (!ALLOWED_IMAGE_TYPES.has(opts.contentType)) {
    throw new Error(`Unsupported image type: ${opts.contentType}`);
  }
  if (opts.size <= 0 || opts.size > MAX_GROUP_LOGO_BYTES) {
    throw new Error(`File too large (max ${MAX_GROUP_LOGO_BYTES / 1024 / 1024}MB)`);
  }

  const ext = EXT_BY_TYPE[opts.contentType];
  const id = randomBytes(12).toString("hex");
  const ownerPath = opts.groupId ? `group-${opts.groupId}` : `draft-${opts.userId}`;
  const key = `group-logos/${ownerPath}/${id}.${ext}`;

  const cfg = await getSpaces();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    // Objects are served publicly via the Space's bucket policy, so we do NOT
    // sign an ACL header here: the browser PUTs with only Content-Type, and a
    // signed `x-amz-acl` it doesn't replay would make the object upload private.
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60;
  const uploadUrl = await getSignedUrl(cfg.client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: buildPublicUrl(cfg, key),
    contentType: opts.contentType,
    maxBytes: MAX_GROUP_LOGO_BYTES,
    expiresIn,
  };
}

export async function presignArticleMediaUpload(opts: {
  userId: string;
  articleId?: string;
  contentType: string;
  size: number;
}): Promise<PresignedUpload> {
  if (!ALLOWED_MESSAGE_MEDIA_TYPES.has(opts.contentType)) {
    throw new Error(`Unsupported media type: ${opts.contentType}`);
  }
  if (opts.size <= 0 || opts.size > MAX_MESSAGE_MEDIA_BYTES) {
    throw new Error(`File too large (max ${MAX_MESSAGE_MEDIA_BYTES / 1024 / 1024}MB)`);
  }

  const ext = EXT_BY_TYPE[opts.contentType];
  const id = randomBytes(12).toString("hex");
  const articleSeg = opts.articleId ?? "drafts";
  const key = `articles/${articleSeg}/${opts.userId}/${id}.${ext}`;

  const cfg = await getSpaces();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    // Objects are served publicly via the Space's bucket policy, so we do NOT
    // sign an ACL header here: the browser PUTs with only Content-Type, and a
    // signed `x-amz-acl` it doesn't replay would make the object upload private.
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60;
  const uploadUrl = await getSignedUrl(cfg.client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: buildPublicUrl(cfg, key),
    contentType: opts.contentType,
    maxBytes: MAX_MESSAGE_MEDIA_BYTES,
    expiresIn,
  };
}

export async function presignMediaLibraryUpload(opts: {
  userId: string;
  contentType: string;
  size: number;
  kind: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
}): Promise<PresignedUpload> {
  if (!ALLOWED_LIBRARY_MEDIA_TYPES.has(opts.contentType)) {
    throw new Error(`Unsupported media type: ${opts.contentType}`);
  }
  if (opts.size <= 0 || opts.size > MAX_LIBRARY_MEDIA_BYTES) {
    throw new Error(`File too large (max ${MAX_LIBRARY_MEDIA_BYTES / 1024 / 1024}MB)`);
  }

  const ext = EXT_BY_TYPE[opts.contentType];
  const id = randomBytes(12).toString("hex");
  const key = `media/${opts.userId}/${opts.kind.toLowerCase()}/${id}.${ext}`;

  const cfg = await getSpaces();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    // Objects are served publicly via the Space's bucket policy, so we do NOT
    // sign an ACL header here: the browser PUTs with only Content-Type, and a
    // signed `x-amz-acl` it doesn't replay would make the object upload private.
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60;
  const uploadUrl = await getSignedUrl(cfg.client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: buildPublicUrl(cfg, key),
    contentType: opts.contentType,
    maxBytes: MAX_LIBRARY_MEDIA_BYTES,
    expiresIn,
  };
}

/**
 * Server-side upload of bytes we already hold (rather than presigning a browser
 * PUT). Used by the AI draft generator to store cover images it fetched from the
 * image provider. Returns the object key + public URL.
 */
export async function uploadGeneratedImage(opts: {
  body: Buffer;
  contentType: string;
  /** Path segment grouping these objects, e.g. "ai-drafts". */
  prefix?: string;
}): Promise<{ key: string; publicUrl: string; contentType: string; size: number }> {
  if (!ALLOWED_IMAGE_TYPES.has(opts.contentType)) {
    throw new Error(`Unsupported image type: ${opts.contentType}`);
  }
  const ext = EXT_BY_TYPE[opts.contentType] ?? "png";
  const id = randomBytes(12).toString("hex");
  const key = `${opts.prefix ?? "ai-drafts"}/${id}.${ext}`;

  const cfg = await getSpaces();
  await cfg.client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: opts.body,
      ContentType: opts.contentType,
      ContentLength: opts.body.byteLength,
      ACL: "public-read",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return {
    key,
    publicUrl: buildPublicUrl(cfg, key),
    contentType: opts.contentType,
    size: opts.body.byteLength,
  };
}

export async function deleteStoredObject(key: string) {
  const cfg = await getSpaces();
  await cfg.client.send(
    new DeleteObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
    }),
  );
}

export async function presignCampaignMediaUpload(opts: {
  userId: string;
  category?: string;
  contentType: string;
  size: number;
}): Promise<PresignedUpload> {
  const category = opts.category?.toUpperCase();
  if (!ALLOWED_CAMPAIGN_MEDIA_TYPES.has(opts.contentType)) {
    throw new Error(`Unsupported media type: ${opts.contentType}`);
  }
  if (category) {
    const allowed = CAMPAIGN_MEDIA_TYPES_BY_CATEGORY[category];
    if (!allowed) throw new Error("Choose a valid media category.");
    if (!allowed.has(opts.contentType)) {
      throw new Error(`This file type is not allowed for ${category.toLowerCase()}.`);
    }
  }
  if (opts.size <= 0 || opts.size > MAX_MESSAGE_MEDIA_BYTES) {
    throw new Error(`File too large (max ${MAX_MESSAGE_MEDIA_BYTES / 1024 / 1024}MB)`);
  }

  const ext = EXT_BY_TYPE[opts.contentType];
  const id = randomBytes(12).toString("hex");
  const key = `campaign-media/${opts.userId}/${id}.${ext}`;

  const cfg = await getSpaces();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    // Objects are served publicly via the Space's bucket policy, so we do NOT
    // sign an ACL header here: the browser PUTs with only Content-Type, and a
    // signed `x-amz-acl` it doesn't replay would make the object upload private.
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60;
  const uploadUrl = await getSignedUrl(cfg.client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: buildPublicUrl(cfg, key),
    contentType: opts.contentType,
    maxBytes: MAX_MESSAGE_MEDIA_BYTES,
    expiresIn,
  };
}

export async function presignGroupMessageMediaUpload(opts: {
  userId: string;
  groupId: string;
  contentType: string;
  size: number;
  campaignOnly?: boolean;
}): Promise<PresignedUpload> {
  const allowed = opts.campaignOnly ? ALLOWED_CAMPAIGN_IMAGE_TYPES : ALLOWED_MESSAGE_MEDIA_TYPES;
  if (!allowed.has(opts.contentType)) {
    throw new Error(
      opts.campaignOnly
        ? "Campaign media must be a PNG or JPEG image."
        : `Unsupported media type: ${opts.contentType}`,
    );
  }
  if (opts.size <= 0 || opts.size > MAX_MESSAGE_MEDIA_BYTES) {
    throw new Error(`File too large (max ${MAX_MESSAGE_MEDIA_BYTES / 1024 / 1024}MB)`);
  }

  const ext = EXT_BY_TYPE[opts.contentType];
  const id = randomBytes(12).toString("hex");
  const key = `group-media/${opts.groupId}/${opts.userId}/${id}.${ext}`;

  const cfg = await getSpaces();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    // Objects are served publicly via the Space's bucket policy, so we do NOT
    // sign an ACL header here: the browser PUTs with only Content-Type, and a
    // signed `x-amz-acl` it doesn't replay would make the object upload private.
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60;
  const uploadUrl = await getSignedUrl(cfg.client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: buildPublicUrl(cfg, key),
    contentType: opts.contentType,
    maxBytes: MAX_MESSAGE_MEDIA_BYTES,
    expiresIn,
  };
}

import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";

/**
 * DigitalOcean Spaces (S3-compatible) client + presigned PUT URL helper.
 *
 * Browser uploads directly to Spaces using the signed URL — the server only
 * signs, never streams the bytes. Set:
 *   DO_SPACES_REGION         (e.g. fra1)
 *   DO_SPACES_ENDPOINT       (https://<region>.digitaloceanspaces.com)
 *   DO_SPACES_BUCKET
 *   DO_SPACES_KEY / DO_SPACES_SECRET
 *   DO_SPACES_CDN_ENDPOINT   (optional CDN URL; falls back to origin)
 */

const REGION = process.env.DO_SPACES_REGION ?? "fra1";
const ENDPOINT =
  process.env.DO_SPACES_ENDPOINT ?? `https://${REGION}.digitaloceanspaces.com`;

let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET) {
    throw new Error("DO_SPACES_KEY / DO_SPACES_SECRET are not set");
  }
  _client = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    forcePathStyle: false,
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
    },
  });
  return _client;
}

function bucket(): string {
  const b = process.env.DO_SPACES_BUCKET;
  if (!b) throw new Error("DO_SPACES_BUCKET is not set");
  return b;
}

/** Public URL for a stored object — CDN if configured, else the Spaces origin. */
export function publicUrl(key: string): string {
  const base =
    process.env.DO_SPACES_CDN_ENDPOINT?.replace(/\/+$/, "") ||
    `${ENDPOINT.replace(/\/+$/, "")}/${bucket()}`;
  return `${base}/${key.replace(/^\/+/, "")}`;
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
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
  JINGLES: new Set(["audio/mp3", "audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/x-mpeg"]),
  VIDEOS: new Set(["video/mp4", "video/webm"]),
  BANNERS: new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  FLIERS: new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  DOCUMENTS: new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
};
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_GROUP_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_MESSAGE_MEDIA_BYTES = 50 * 1024 * 1024; // 50 MB

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

  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60; // 1 minute is plenty for an avatar upload
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: publicUrl(key),
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

  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60;
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: publicUrl(key),
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

  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60;
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: publicUrl(key),
    contentType: opts.contentType,
    maxBytes: MAX_MESSAGE_MEDIA_BYTES,
    expiresIn,
  };
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

  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60;
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: publicUrl(key),
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

  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.size,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresIn = 60;
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: publicUrl(key),
    contentType: opts.contentType,
    maxBytes: MAX_MESSAGE_MEDIA_BYTES,
    expiresIn,
  };
}

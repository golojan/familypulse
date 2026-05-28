import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMediaManager, type MediaKindValue } from "@/lib/media-data";
import { presignMediaLibraryUpload } from "@/lib/storage";

export const runtime = "nodejs";

const KIND_BY_TYPE: Array<{ prefix: string; kind: MediaKindValue }> = [
  { prefix: "image/", kind: "IMAGE" },
  { prefix: "video/", kind: "VIDEO" },
  { prefix: "audio/", kind: "AUDIO" },
  { prefix: "application/pdf", kind: "DOCUMENT" },
];

function inferKind(contentType: string): MediaKindValue {
  return KIND_BY_TYPE.find((item) => contentType.startsWith(item.prefix))?.kind ?? "DOCUMENT";
}

export async function POST(request: Request) {
  try {
    const userId = await requireMediaManager();
    const body = (await request.json()) as {
      filename?: string;
      contentType?: string;
      size?: number;
      kind?: MediaKindValue;
    };
    const filename = String(body.filename ?? "").trim();
    const contentType = String(body.contentType ?? "").trim();
    const size = Number(body.size ?? 0);
    const kind = body.kind ?? inferKind(contentType);

    if (!filename || !contentType || !Number.isFinite(size)) {
      return NextResponse.json({ error: "Invalid upload metadata." }, { status: 400 });
    }

    const signed = await presignMediaLibraryUpload({
      userId,
      contentType,
      size,
      kind,
    });
    const media = await prisma.mediaAsset.create({
      data: {
        key: signed.key,
        url: signed.publicUrl,
        filename,
        kind,
        status: "PENDING",
        contentType,
        size,
        uploadedById: userId,
      },
      select: {
        id: true,
        key: true,
        url: true,
        filename: true,
        kind: true,
        status: true,
      },
    });

    return NextResponse.json({ ...signed, media });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign upload.";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

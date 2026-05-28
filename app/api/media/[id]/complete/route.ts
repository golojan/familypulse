import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMediaManager } from "@/lib/media-data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireMediaManager();
    const { id } = await params;
    const media = await prisma.mediaAsset.update({
      where: { id },
      data: { status: "READY" },
      select: {
        id: true,
        url: true,
        filename: true,
        kind: true,
        status: true,
      },
    });
    return NextResponse.json({ media });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete upload.";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

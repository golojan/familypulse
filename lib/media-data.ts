import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CAN_MANAGE_MEDIA = ["EDITOR", "SUPERADMIN"];

export type MediaKindValue = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";

export type MediaAssetItem = {
  id: string;
  key: string;
  url: string;
  filename: string;
  alt: string | null;
  kind: MediaKindValue;
  status: "PENDING" | "READY";
  contentType: string;
  size: number;
  createdAt: Date;
};

export async function requireMediaManager() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  const canManage = session.user.roles?.some((role) => CAN_MANAGE_MEDIA.includes(role));
  if (!canManage) {
    throw new Error("FORBIDDEN");
  }
  return session.user.id;
}

export async function listMediaAssets(): Promise<MediaAssetItem[]> {
  await requireMediaManager();
  return prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      key: true,
      url: true,
      filename: true,
      alt: true,
      kind: true,
      status: true,
      contentType: true,
      size: true,
      createdAt: true,
    },
  });
}

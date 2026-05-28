"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMediaManager } from "@/lib/media-data";
import { deleteStoredObject } from "@/lib/storage";

export async function updateMediaAsset(formData: FormData) {
  await requireMediaManager();
  const id = String(formData.get("id") ?? "");
  const filename = String(formData.get("filename") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();

  if (!id || !filename) {
    return;
  }

  await prisma.mediaAsset.update({
    where: { id },
    data: {
      filename,
      alt: alt || null,
    },
  });
  revalidatePath("/dashboard/media");
}

export async function deleteMediaAsset(id: string) {
  await requireMediaManager();
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { key: true },
  });

  if (!asset) {
    return;
  }

  try {
    await deleteStoredObject(asset.key);
  } catch (error) {
    console.warn("Failed to delete object from Spaces; removing DB record.", error);
  }

  await prisma.mediaAsset.delete({ where: { id } });
  revalidatePath("/dashboard/media");
}

"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Copy, FileText, Loader2, Pencil, Trash2 } from "lucide-react";
import { type MediaAssetItem, type MediaKindValue } from "@/lib/media-data";
import { deleteMediaAsset, updateMediaAsset } from "@/app/dashboard/media/actions";
import { MediaUploadField } from "./media-upload-field";

const KIND_FILTERS: Array<"ALL" | MediaKindValue> = ["ALL", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT"];

export function MediaLibrary({ assets }: { assets: MediaAssetItem[] }) {
  const [filter, setFilter] = useState<"ALL" | MediaKindValue>("ALL");
  const visibleAssets = filter === "ALL" ? assets : assets.filter((asset) => asset.kind === filter);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-fp-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-fp-ink">Upload media</h2>
            <p className="mt-1 text-sm font-semibold text-fp-muted">
              Files upload directly to DigitalOcean Spaces using signed URLs and are tracked here.
            </p>
          </div>
          {/* One upload button; the file type (image/video/audio/document) is
              detected from the chosen file and stored by the server. */}
          <MediaUploadField
            variant="button"
            accept="image/*,video/*,audio/*,application/pdf"
            label="Upload"
            onUploaded={() => window.location.reload()}
          />
        </div>
      </section>

      <section className="rounded-lg border border-fp-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-fp-ink">Media library</h2>
            <p className="mt-1 text-sm font-semibold text-fp-muted">
              {visibleAssets.length} item{visibleAssets.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {KIND_FILTERS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setFilter(kind)}
                className={`rounded-md px-3 py-2 text-xs font-extrabold ${
                  filter === kind
                    ? "bg-fp-green !text-white"
                    : "border border-fp-line bg-white text-fp-muted"
                }`}
              >
                {kind === "ALL" ? "All" : kind.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleAssets.map((asset) => (
            <MediaCard key={asset.id} asset={asset} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MediaCard({ asset }: { asset: MediaAssetItem }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <article className="overflow-hidden rounded-md border border-fp-line bg-fp-soft">
      <div className="relative grid aspect-video place-items-center bg-white">
        {asset.kind === "IMAGE" ? (
          <Image
            src={asset.url}
            alt={asset.alt ?? asset.filename}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 50vw, 33vw"
          />
        ) : asset.kind === "VIDEO" ? (
          <video src={asset.url} className="h-full w-full object-cover" controls />
        ) : asset.kind === "AUDIO" ? (
          <audio src={asset.url} className="w-[90%]" controls />
        ) : (
          <FileText className="h-12 w-12 text-fp-green" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase text-fp-green shadow-soft">
          {asset.kind.toLowerCase()}
        </span>
      </div>

      <div className="p-4">
        {editing ? (
          <form action={updateMediaAsset} className="grid gap-2" onSubmit={() => setEditing(false)}>
            <input type="hidden" name="id" value={asset.id} />
            <input
              className="rounded-md border border-fp-line px-3 py-2 text-sm font-semibold outline-none"
              name="filename"
              defaultValue={asset.filename}
            />
            <input
              className="rounded-md border border-fp-line px-3 py-2 text-sm font-semibold outline-none"
              name="alt"
              defaultValue={asset.alt ?? ""}
              placeholder="Alt text"
            />
            <button className="rounded-md bg-fp-green px-3 py-2 text-sm font-extrabold !text-white">
              Save
            </button>
          </form>
        ) : (
          <>
            <h3 className="truncate text-sm font-extrabold text-fp-ink">{asset.filename}</h3>
            <p className="mt-1 text-xs font-semibold text-fp-muted">
              {asset.status.toLowerCase()} · {formatBytes(asset.size)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(asset.url)}
                className="inline-flex items-center gap-1.5 rounded-md border border-fp-line bg-white px-3 py-1.5 text-xs font-extrabold text-fp-ink"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-fp-line bg-white px-3 py-1.5 text-xs font-extrabold text-fp-ink"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete this media item?")) return;
                  startTransition(() => void deleteMediaAsset(asset.id));
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-extrabold text-red-600 disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

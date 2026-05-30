"use client";

import { useState } from "react";
import { ImageIcon, Loader2, Trash2, Video } from "lucide-react";
import { isYouTubeUrl, resolveVideoEmbed, youTubeId, youTubeThumbnail } from "@/lib/video";
import { MediaUploadField } from "./media-upload-field";

type VideoEditorProps = {
  videoUrl: string;
  cover: string;
  locked?: boolean;
  onVideoChange: (url: string) => void;
  onCoverChange: (url: string) => void;
};

/**
 * Video post body. Replaces the block editor when the post type is VIDEO.
 *
 * Empty state: a drop/upload zone for a video file plus a YouTube/URL input.
 * Once a URL is present (typed + detected on blur/leave, or an upload finishes)
 * it swaps to a player preview with a delete button (top-right) that clears the
 * video and returns to the empty state. The cover is generated from the video —
 * the YouTube thumbnail for YouTube, or a captured frame for an uploaded file —
 * so there is no separate cover upload for video posts.
 */
export function VideoEditor({
  videoUrl,
  cover,
  locked = false,
  onVideoChange,
  onCoverChange,
}: VideoEditorProps) {
  // Local text state so we can "smart detect" only on blur / mouse-leave,
  // rather than committing the video on every keystroke.
  const [draftUrl, setDraftUrl] = useState(videoUrl);
  const [coverState, setCoverState] = useState<"idle" | "working" | "error">("idle");
  const [coverError, setCoverError] = useState("");

  const embed = resolveVideoEmbed(videoUrl);

  // Commit the typed URL: if it resolves to a playable video, load it and (for
  // YouTube) seed the cover from the thumbnail automatically.
  function commitUrl() {
    const url = draftUrl.trim();
    if (!url || url === videoUrl) return;
    const resolved = resolveVideoEmbed(url);
    if (!resolved) return;
    onVideoChange(url);
    if (resolved.kind === "youtube" && !cover) {
      onCoverChange(youTubeThumbnail(resolved.id, "max"));
    }
  }

  function clearVideo() {
    setDraftUrl("");
    onVideoChange("");
  }

  async function generateCover() {
    if (!videoUrl || locked) return;
    setCoverState("working");
    setCoverError("");
    try {
      if (isYouTubeUrl(videoUrl)) {
        const id = youTubeId(videoUrl);
        if (!id) throw new Error("Could not read the YouTube video id.");
        // Thumbnail URL is stable and public; no upload needed.
        onCoverChange(youTubeThumbnail(id, "max"));
      } else {
        const blob = await captureVideoFrame(videoUrl);
        const uploadedUrl = await uploadGeneratedCover(blob);
        onCoverChange(uploadedUrl);
      }
      setCoverState("idle");
    } catch (error) {
      setCoverState("error");
      setCoverError(
        error instanceof Error ? error.message : "Could not generate a cover from this video.",
      );
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-fp-line bg-white p-5 shadow-card sm:p-6">
      <p className="flex items-center gap-2 text-sm font-extrabold text-fp-ink">
        <Video className="h-4 w-4 text-fp-green" />
        Video
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-fp-muted">
        Paste a YouTube link or drop a video file. The cover is generated from the video.
      </p>

      {embed ? (
        <div className="mt-4">
          <div className="relative overflow-hidden rounded-md border border-fp-line bg-fp-ink">
            {!locked ? (
              <button
                type="button"
                onClick={clearVideo}
                aria-label="Remove video"
                title="Remove video"
                className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-md bg-black/60 text-white backdrop-blur transition hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            {embed.kind === "youtube" ? (
              <iframe
                key={embed.embedUrl}
                className="aspect-video w-full"
                src={embed.embedUrl}
                title="Video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video key={embed.src} className="aspect-video w-full" src={embed.src} controls />
            )}
          </div>

          <p className="mt-2 break-all text-xs font-semibold text-fp-muted">{videoUrl}</p>

          {!locked ? (
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={generateCover}
                disabled={coverState === "working"}
                className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-md border border-fp-line bg-white px-3 text-sm font-extrabold text-fp-ink shadow-soft hover:border-fp-green hover:text-fp-green disabled:opacity-50"
              >
                {coverState === "working" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                {coverState === "working" ? "Generating cover…" : "Generate cover from video"}
              </button>
              {coverError ? <p className="text-xs font-bold text-red-600">{coverError}</p> : null}
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt="Generated cover preview"
                  className="mt-1 aspect-video w-full max-w-xs rounded-md border border-fp-line object-cover"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2 text-xs font-extrabold uppercase text-fp-muted">
            YouTube or video URL
            <input
              className="w-full rounded-md border border-fp-line bg-white px-3 py-2 text-sm font-semibold normal-case text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15"
              value={draftUrl}
              disabled={locked}
              onChange={(event) => setDraftUrl(event.target.value)}
              onBlur={commitUrl}
              onMouseLeave={commitUrl}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitUrl();
                }
              }}
              placeholder="https://youtube.com/watch?v=…"
            />
          </label>

          <div className="flex items-center gap-3 text-xs font-extrabold uppercase text-fp-muted">
            <span className="h-px flex-1 bg-fp-line" />
            or
            <span className="h-px flex-1 bg-fp-line" />
          </div>

          {locked ? null : (
            <MediaUploadField
              accept="video/*"
              kind="VIDEO"
              label="Drop or upload a video"
              onUploaded={(url) => {
                setDraftUrl(url);
                onVideoChange(url);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

type GeneratedCoverPresignResponse = {
  uploadUrl: string;
  contentType: string;
  media: { id: string; url: string };
  error?: string;
};

/** Capture a frame from an uploaded (direct) video URL for use as a cover. */
function captureVideoFrame(source: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    let settled = false;
    const timeout = window.setTimeout(() => {
      finish(new Error("Could not read a frame from this video."));
    }, 15000);

    function finish(error?: Error, blob?: Blob) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      video.removeAttribute("src");
      video.load();
      if (error) {
        reject(error);
        return;
      }
      if (blob) resolve(blob);
    }

    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    video.addEventListener("error", () => {
      finish(new Error("Use an uploaded direct video URL to generate a cover."));
    });
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = Number.isFinite(video.duration)
        ? Math.min(1, Math.max(0, video.duration / 5))
        : 0;
    });
    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const context = canvas.getContext("2d");
        if (!context) {
          finish(new Error("Could not create a cover image."));
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              finish(new Error("Could not create a cover image."));
              return;
            }
            finish(undefined, blob);
          },
          "image/jpeg",
          0.86,
        );
      } catch {
        finish(new Error("This video does not allow browser frame capture."));
      }
    });

    video.src = source;
    video.load();
  });
}

async function uploadGeneratedCover(blob: Blob) {
  const presign = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: `video-cover-${Date.now()}.jpg`,
      contentType: "image/jpeg",
      size: blob.size,
      kind: "IMAGE",
    }),
  });
  const signed = (await presign.json()) as GeneratedCoverPresignResponse;
  if (!presign.ok) {
    throw new Error(signed.error ?? "Could not prepare cover upload.");
  }
  const uploadResponse = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": signed.contentType },
    body: blob,
  });
  if (!uploadResponse.ok) {
    throw new Error("Cover upload failed.");
  }
  await fetch(`/api/media/${signed.media.id}/complete`, { method: "POST" });
  return signed.media.url;
}

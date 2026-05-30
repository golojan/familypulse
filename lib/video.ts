// Shared video URL helpers used by the editor (preview + cover) and the public
// post page (embed). Keeping detection in one place means "smart" YouTube
// handling behaves identically everywhere.

/** True if the URL looks like a YouTube watch/share/embed link. */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url.trim());
}

/**
 * Extract the 11-char YouTube video id from any common URL shape:
 * watch?v=, youtu.be/, /embed/, /shorts/. Returns null if none found.
 */
export function youTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return isValidId(id) ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v && isValidId(v)) return v;
      // /embed/<id> or /shorts/<id>
      const segments = parsed.pathname.split("/").filter(Boolean);
      const idx = segments.findIndex((s) => s === "embed" || s === "shorts");
      if (idx !== -1 && isValidId(segments[idx + 1])) return segments[idx + 1];
    }
    return null;
  } catch {
    // Not a parseable URL — try a loose match for a bare id.
    const match = trimmed.match(/[A-Za-z0-9_-]{11}/);
    return match && isValidId(match[0]) ? match[0] : null;
  }
}

function isValidId(id: string | undefined): id is string {
  return Boolean(id) && /^[A-Za-z0-9_-]{11}$/.test(id as string);
}

/** Privacy-friendly embed URL for an id. */
export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

/**
 * Best available YouTube thumbnail URL for a video id. `maxresdefault` isn't
 * guaranteed to exist for every video; `hqdefault` always does, so callers that
 * need a guaranteed image should prefer that.
 */
export function youTubeThumbnail(id: string, quality: "max" | "hq" = "hq"): string {
  const file = quality === "max" ? "maxresdefault" : "hqdefault";
  return `https://img.youtube.com/vi/${id}/${file}.jpg`;
}

/**
 * Resolve a video URL to an embeddable source. For YouTube we return the
 * nocookie embed; for anything else we assume a direct/uploaded video file.
 */
export function resolveVideoEmbed(
  url: string,
): { kind: "youtube"; id: string; embedUrl: string } | { kind: "file"; src: string } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const id = isYouTubeUrl(trimmed) ? youTubeId(trimmed) : null;
  if (id) return { kind: "youtube", id, embedUrl: youTubeEmbedUrl(id) };
  return { kind: "file", src: trimmed };
}

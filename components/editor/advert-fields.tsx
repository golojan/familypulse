"use client";

import { ADVERT_FORMATS, type AdvertBlock, type AdvertFormat } from "@/lib/posts";
import { MediaUploadField } from "../media-upload-field";

const FIELD =
  "w-full rounded-md border border-fp-line bg-white px-3 py-2 text-sm font-semibold text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15";

const FORMAT_LABEL: Record<AdvertFormat, string> = {
  image: "Image ad",
  text: "Text ad",
  embed: "Embed / AdSense",
};

/**
 * Editing UI for an advert block. A format switch (Image / Text / Embed) reveals
 * the relevant fields. Image uses the signed media upload; embed offers AdSense
 * (slot id) or a sandboxed iframe (src).
 */
export function AdvertFields({
  block,
  onChange,
  readOnly = false,
}: {
  block: AdvertBlock;
  onChange: (patch: Partial<AdvertBlock>) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {ADVERT_FORMATS.map((format) => (
          <button
            key={format}
            type="button"
            disabled={readOnly}
            onClick={() => onChange({ format })}
            className={`rounded-md px-3 py-1.5 text-xs font-extrabold ${
              block.format === format
                ? "bg-fp-green text-white"
                : "border border-fp-line bg-white text-fp-muted"
            }`}
          >
            {FORMAT_LABEL[format]}
          </button>
        ))}
      </div>

      {block.format === "image" ? (
        <div className="grid gap-2">
          {block.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.imageUrl}
              alt={block.alt ?? ""}
              className="max-h-40 w-full rounded-md border border-fp-line object-contain"
            />
          ) : null}
          {readOnly ? null : (
            <MediaUploadField
              accept="image/*"
              kind="IMAGE"
              label={block.imageUrl ? "Replace banner image" : "Upload banner image"}
              onUploaded={(url) => onChange({ imageUrl: url })}
            />
          )}
          <input
            className={FIELD}
            value={block.href ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ href: e.target.value })}
            placeholder="Click-through URL (https://…)"
          />
          <input
            className={FIELD}
            value={block.alt ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt text (accessibility)"
          />
        </div>
      ) : null}

      {block.format === "text" ? (
        <div className="grid gap-2">
          <input
            className={`${FIELD} font-bold`}
            value={block.heading ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ heading: e.target.value })}
            placeholder="Ad headline"
          />
          <textarea
            className={`${FIELD} min-h-20 resize-y leading-6`}
            value={block.body ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder="Ad body text"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={FIELD}
              value={block.ctaLabel ?? ""}
              disabled={readOnly}
              onChange={(e) => onChange({ ctaLabel: e.target.value })}
              placeholder="Button label (e.g. Learn more)"
            />
            <input
              className={FIELD}
              value={block.href ?? ""}
              disabled={readOnly}
              onChange={(e) => onChange({ href: e.target.value })}
              placeholder="Button URL (https://…)"
            />
          </div>
        </div>
      ) : null}

      {block.format === "embed" ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            {(["adsense", "iframe"] as const).map((provider) => (
              <button
                key={provider}
                type="button"
                disabled={readOnly}
                onClick={() => onChange({ provider })}
                className={`rounded-md px-3 py-1.5 text-xs font-extrabold ${
                  (block.provider ?? "adsense") === provider
                    ? "bg-fp-green text-white"
                    : "border border-fp-line bg-white text-fp-muted"
                }`}
              >
                {provider === "adsense" ? "Google AdSense" : "Iframe embed"}
              </button>
            ))}
          </div>

          {(block.provider ?? "adsense") === "adsense" ? (
            <>
              <input
                className={FIELD}
                value={block.adSlot ?? ""}
                disabled={readOnly}
                onChange={(e) => onChange({ adSlot: e.target.value })}
                placeholder="AdSense ad slot id (e.g. 1234567890)"
              />
              <p className="text-xs font-semibold text-fp-muted">
                Uses your site AdSense Publisher ID (Site Settings → Advertising). The slot id comes
                from the ad unit you created in AdSense.
              </p>
            </>
          ) : (
            <>
              <input
                className={FIELD}
                value={block.embedSrc ?? ""}
                disabled={readOnly}
                onChange={(e) => onChange({ embedSrc: e.target.value })}
                placeholder="Embed URL (https://…) — loaded in a sandboxed iframe"
              />
              <p className="text-xs font-semibold text-fp-muted">
                The URL is rendered inside a sandboxed iframe. Only paste embeds you trust.
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

import Script from "next/script";
import { type AdvertBlock, type Block, type ImageAlign, type ImageWidth } from "@/lib/posts";
import { PostGate } from "./post-gate";

/** When set, the body is metered: only the lead is shown, then the gate prompt. */
export type PostGateInfo = { postId: string; postSlug: string; isAuthenticated: boolean };

/**
 * Number of leading paragraphs shown before the subscription gate. Blocks before
 * the Nth paragraph (headings/images/etc.) are shown too, so the preview reads
 * naturally up to that point.
 */
const GATE_PREVIEW_PARAGRAPHS = 2;

/**
 * Shared post body renderer used by both the public post page and the editor's
 * live preview, so what an author sees while drafting matches what ships.
 *
 * Renders the typed block list (heading / paragraph / quote / list / image /
 * advert). Image blocks honor their alignment + width; advert blocks render as
 * image, text, or embed (AdSense unit or sandboxed iframe). `adsenseClientId`
 * is the site's AdSense publisher id (from settings) — required for AdSense
 * adverts to render their unit + loader.
 *
 * When `gate` is provided, the body is metered Medium/Substack-style: only the
 * first couple of paragraphs render, then a subscribe prompt replaces the rest.
 */
export function PostBody({
  blocks,
  excerpt,
  topicName,
  adsenseClientId,
  gate,
}: {
  blocks?: Block[];
  excerpt?: string | null;
  topicName: string;
  adsenseClientId?: string | null;
  gate?: PostGateInfo | null;
}) {
  if (!blocks?.length) {
    return (
      <div className="mt-8 rounded-lg border border-fp-line bg-white p-5 text-base font-semibold leading-8 text-fp-muted shadow-card sm:p-8">
        <p>
          {excerpt ||
            `This FamilyPulse article belongs to the ${topicName} topic. It is part of a grouped reading path, so readers can move from this post into related guidance without searching manually.`}
        </p>
        <p className="mt-5">
          Use the related posts below to continue through the same topic, or return to the topic
          page to view the full collection.
        </p>
      </div>
    );
  }

  // Metered preview: keep blocks up to and including the Nth paragraph.
  let visibleBlocks = blocks;
  let gated = false;
  if (gate) {
    let paragraphs = 0;
    let cut = blocks.length;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type === "paragraph") {
        paragraphs += 1;
        if (paragraphs >= GATE_PREVIEW_PARAGRAPHS) {
          cut = i + 1;
          break;
        }
      }
    }
    if (cut < blocks.length) {
      visibleBlocks = blocks.slice(0, cut);
      gated = true;
    }
  }

  const usesAdsense = visibleBlocks.some(
    (b) => b.type === "advert" && b.format === "embed" && b.provider === "adsense",
  );

  return (
    <div className="mt-8 rounded-lg border border-fp-line bg-white p-5 text-base font-semibold leading-8 text-fp-muted shadow-card sm:p-8">
      {usesAdsense && adsenseClientId ? (
        <Script
          id="adsense-loader"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
            adsenseClientId,
          )}`}
        />
      ) : null}

      {visibleBlocks.map((block) => {
        switch (block.type) {
          case "heading": {
            const HeadingTag = block.level === 3 ? "h3" : "h2";
            return (
              <HeadingTag
                key={block.id}
                className="mt-7 text-2xl font-bold leading-tight text-fp-ink first:mt-0"
              >
                {block.text}
              </HeadingTag>
            );
          }
          case "paragraph":
            return (
              <p key={block.id} className="mt-5 first:mt-0">
                {block.text}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={block.id}
                className="mt-6 border-l-4 border-fp-green bg-fp-mint/40 px-5 py-4 text-lg font-bold leading-8 text-fp-ink"
              >
                {block.text}
                {block.cite ? (
                  <cite className="mt-3 block text-sm font-semibold text-fp-muted">
                    - {block.cite}
                  </cite>
                ) : null}
              </blockquote>
            );
          case "list": {
            const ListTag = block.ordered ? "ol" : "ul";
            return (
              <ListTag
                key={block.id}
                className={`mt-5 space-y-2 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, i) => (
                  <li key={`${block.id}-${i}`}>{item}</li>
                ))}
              </ListTag>
            );
          }
          case "image":
            return (
              <ImageFigure
                key={block.id}
                url={block.url}
                alt={block.alt}
                caption={block.caption}
                align={block.align ?? "center"}
                width={block.width ?? "large"}
              />
            );
          case "advert":
            return <Advert key={block.id} block={block} adsenseClientId={adsenseClientId} />;
        }
      })}

      {gated && gate ? (
        <div className="mt-6">
          <PostGate
            postId={gate.postId}
            postSlug={gate.postSlug}
            isAuthenticated={gate.isAuthenticated}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Tailwind max-width per width setting (relative to the article column). */
const WIDTH_CLASS: Record<ImageWidth, string> = {
  small: "max-w-xs",
  medium: "max-w-md",
  large: "max-w-2xl",
  full: "max-w-none",
};

/** Wrapper alignment per align setting. */
const ALIGN_CLASS: Record<ImageAlign, string> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
  full: "mx-auto",
};

function ImageFigure({
  url,
  alt,
  caption,
  align,
  width,
}: {
  url: string;
  alt?: string;
  caption?: string;
  align: ImageAlign;
  width: ImageWidth;
}) {
  const effectiveWidth: ImageWidth = align === "full" ? "full" : width;
  return (
    <figure className={`mt-7 ${WIDTH_CLASS[effectiveWidth]} ${ALIGN_CLASS[align]}`}>
      <div className="overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt ?? ""} className="h-auto w-full object-cover" loading="lazy" />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-sm font-semibold text-fp-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

const AD_LABEL = (
  <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-fp-muted/60">
    Advertisement
  </span>
);

function Advert({
  block,
  adsenseClientId,
}: {
  block: AdvertBlock;
  adsenseClientId?: string | null;
}) {
  if (block.format === "image" && block.imageUrl) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={block.imageUrl}
        alt={block.alt ?? "Advertisement"}
        className="mx-auto h-auto max-w-full rounded-md"
        loading="lazy"
      />
    );
    return (
      <aside className="my-7">
        {AD_LABEL}
        {block.href ? (
          <a href={block.href} target="_blank" rel="nofollow sponsored noopener">
            {img}
          </a>
        ) : (
          img
        )}
      </aside>
    );
  }

  if (block.format === "text") {
    return (
      <aside className="my-7 rounded-lg border border-fp-line bg-fp-soft p-5">
        {AD_LABEL}
        {block.heading ? (
          <p className="text-lg font-extrabold text-fp-ink">{block.heading}</p>
        ) : null}
        {block.body ? (
          <p className="mt-1 text-sm font-semibold leading-6 text-fp-muted">{block.body}</p>
        ) : null}
        {block.href ? (
          <a
            href={block.href}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="mt-3 inline-flex items-center rounded-md bg-fp-green px-4 py-2 text-sm font-extrabold text-white"
          >
            {block.ctaLabel?.trim() || "Learn more"}
          </a>
        ) : null}
      </aside>
    );
  }

  // embed
  if (block.provider === "iframe" && block.embedSrc) {
    return (
      <aside className="my-7">
        {AD_LABEL}
        <iframe
          src={block.embedSrc}
          title="Advertisement"
          className="aspect-video w-full rounded-md border border-fp-line"
          sandbox="allow-scripts allow-same-origin allow-popups"
          loading="lazy"
        />
      </aside>
    );
  }

  if (block.provider === "adsense" && block.adSlot && adsenseClientId) {
    return (
      <aside className="my-7">
        {AD_LABEL}
        {/* The loader script is injected once by PostBody when any AdSense ad exists. */}
        <ins
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={adsenseClientId}
          data-ad-slot={block.adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <Script id={`adsense-push-${block.id}`} strategy="afterInteractive">
          {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </Script>
      </aside>
    );
  }

  return null;
}

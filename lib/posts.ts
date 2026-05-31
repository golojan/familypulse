// Block model for the multiblock post editor.
//
// A post body is an ordered list of typed blocks, stored as JSON on Post.blocks.
// Keeping this shape isolated lets the editor, renderer, and server actions share
// one source of truth.

export const BLOCK_TYPES = ["heading", "paragraph", "quote", "list", "image", "advert"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

type BaseBlock = {
  id: string;
};

export const IMAGE_ALIGNMENTS = ["left", "center", "right", "full"] as const;
export type ImageAlign = (typeof IMAGE_ALIGNMENTS)[number];

export const IMAGE_WIDTHS = ["small", "medium", "large", "full"] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

export const ADVERT_FORMATS = ["image", "text", "embed"] as const;
export type AdvertFormat = (typeof ADVERT_FORMATS)[number];

export const ADVERT_PROVIDERS = ["adsense", "iframe"] as const;
export type AdvertProvider = (typeof ADVERT_PROVIDERS)[number];

export type HeadingBlock = BaseBlock & {
  type: "heading";
  text: string;
  level: 2 | 3;
};

export type ParagraphBlock = BaseBlock & {
  type: "paragraph";
  text: string;
};

export type QuoteBlock = BaseBlock & {
  type: "quote";
  text: string;
  cite?: string;
};

export type ListBlock = BaseBlock & {
  type: "list";
  ordered: boolean;
  items: string[];
};

export type ImageBlock = BaseBlock & {
  type: "image";
  url: string;
  alt?: string;
  caption?: string;
  /** Horizontal placement on the page. Defaults to "center". */
  align?: ImageAlign;
  /** Rendered width. Defaults to "large". */
  width?: ImageWidth;
};

/**
 * An advertisement an editor can drop anywhere in the body. Three shapes:
 *  - "image": a banner creative (imageUrl) linking to href.
 *  - "text":  a styled promo box (heading + body + CTA linking to href).
 *  - "embed": an ad-network unit — a Google AdSense slot (provider "adsense",
 *    adSlot) rendered against the site's publisher id, or a sandboxed iframe
 *    (provider "iframe", embedSrc). Raw executable HTML is never injected.
 */
export type AdvertBlock = BaseBlock & {
  type: "advert";
  format: AdvertFormat;
  // image format
  imageUrl?: string;
  href?: string;
  alt?: string;
  // text format
  heading?: string;
  body?: string;
  ctaLabel?: string;
  // embed format
  provider?: AdvertProvider;
  adSlot?: string;
  embedSrc?: string;
};

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | QuoteBlock
  | ListBlock
  | ImageBlock
  | AdvertBlock;

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  quote: "Quote",
  list: "List",
  image: "Image",
  advert: "Advert",
};

let blockSeq = 0;

/** Generates a stable-enough client id for a new block. */
export function newBlockId() {
  blockSeq += 1;
  return `b-${Date.now().toString(36)}-${blockSeq.toString(36)}`;
}

/** Returns a fresh empty block of the given type. */
export function createBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "heading":
      return { id, type, text: "", level: 2 };
    case "paragraph":
      return { id, type, text: "" };
    case "quote":
      return { id, type, text: "", cite: "" };
    case "list":
      return { id, type, ordered: false, items: [""] };
    case "image":
      return { id, type, url: "", alt: "", caption: "", align: "center", width: "large" };
    case "advert":
      return { id, type, format: "image", imageUrl: "", href: "", alt: "" };
  }
}

/**
 * Coerces unknown JSON (e.g. Post.blocks from the database) into a typed Block[].
 * Drops anything that doesn't look like a valid block so the editor never crashes
 * on malformed data.
 */
export function parseBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) return [];

  const blocks: Block[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as Record<string, unknown>;
    const id = typeof b.id === "string" ? b.id : newBlockId();

    switch (b.type) {
      case "heading":
        blocks.push({
          id,
          type: "heading",
          text: typeof b.text === "string" ? b.text : "",
          level: b.level === 3 ? 3 : 2,
        });
        break;
      case "paragraph":
        blocks.push({
          id,
          type: "paragraph",
          text: typeof b.text === "string" ? b.text : "",
        });
        break;
      case "quote":
        blocks.push({
          id,
          type: "quote",
          text: typeof b.text === "string" ? b.text : "",
          cite: typeof b.cite === "string" ? b.cite : "",
        });
        break;
      case "list":
        blocks.push({
          id,
          type: "list",
          ordered: b.ordered === true,
          items: Array.isArray(b.items)
            ? b.items.filter((i): i is string => typeof i === "string")
            : [],
        });
        break;
      case "image":
        blocks.push({
          id,
          type: "image",
          url: typeof b.url === "string" ? b.url : "",
          alt: typeof b.alt === "string" ? b.alt : "",
          caption: typeof b.caption === "string" ? b.caption : "",
          align: oneOf(b.align, IMAGE_ALIGNMENTS, "center"),
          width: oneOf(b.width, IMAGE_WIDTHS, "large"),
        });
        break;
      case "advert":
        blocks.push({
          id,
          type: "advert",
          format: oneOf(b.format, ADVERT_FORMATS, "image"),
          imageUrl: str(b.imageUrl),
          href: str(b.href),
          alt: str(b.alt),
          heading: str(b.heading),
          body: str(b.body),
          ctaLabel: str(b.ctaLabel),
          provider: oneOf(b.provider, ADVERT_PROVIDERS, "adsense"),
          adSlot: str(b.adSlot),
          embedSrc: str(b.embedSrc),
        });
        break;
    }
  }
  return blocks;
}

/** Coerce to string, defaulting to "". */
function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Return value if it's one of `allowed`, else `fallback`. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** Strips empty blocks so we don't persist blank trailing paragraphs etc. */
export function cleanBlocks(blocks: Block[]): Block[] {
  return blocks
    .map((block) => {
      if (block.type === "list") {
        return { ...block, items: block.items.map((i) => i.trim()).filter(Boolean) };
      }
      return block;
    })
    .filter((block) => {
      switch (block.type) {
        case "heading":
        case "paragraph":
        case "quote":
          return block.text.trim().length > 0;
        case "list":
          return block.items.length > 0;
        case "image":
          return block.url.trim().length > 0;
        case "advert":
          return advertHasContent(block);
      }
    });
}

/** Whether an advert block carries enough to render for its format. */
function advertHasContent(block: AdvertBlock): boolean {
  switch (block.format) {
    case "image":
      return !!block.imageUrl?.trim();
    case "text":
      return !!(block.heading?.trim() || block.body?.trim());
    case "embed":
      return block.provider === "iframe" ? !!block.embedSrc?.trim() : !!block.adSlot?.trim(); // adsense: needs a slot (client id comes from settings)
  }
}

/** A short plain-text summary derived from the first paragraph/heading. */
export function deriveExcerpt(blocks: Block[], max = 160): string {
  for (const block of blocks) {
    if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") {
      const text = block.text.trim();
      if (text) return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
    }
  }
  return "";
}

/** First image url, used as a cover when the author didn't set one. */
export function deriveCover(blocks: Block[]): string | null {
  const image = blocks.find((b): b is ImageBlock => b.type === "image" && b.url.trim().length > 0);
  return image ? image.url.trim() : null;
}

const SLUG_MAX = 80;

/** URL-safe slug from a title. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

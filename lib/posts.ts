// Block model for the multiblock post editor.
//
// A post body is an ordered list of typed blocks, stored as JSON on Post.blocks.
// Keeping this shape isolated lets the editor, renderer, and server actions share
// one source of truth.

export const BLOCK_TYPES = ["heading", "paragraph", "quote", "list", "image"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

type BaseBlock = {
  id: string;
};

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
};

export type Block = HeadingBlock | ParagraphBlock | QuoteBlock | ListBlock | ImageBlock;

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  quote: "Quote",
  list: "List",
  image: "Image",
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
      return { id, type, url: "", alt: "", caption: "" };
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
        });
        break;
    }
  }
  return blocks;
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
      }
    });
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

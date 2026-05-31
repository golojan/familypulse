"use client";

import {
  Heading,
  Image as ImageIcon,
  List,
  Megaphone,
  Quote,
  Text,
  type LucideIcon,
} from "lucide-react";
import { BLOCK_LABELS, type BlockType } from "@/lib/posts";

export const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  heading: Heading,
  paragraph: Text,
  quote: Quote,
  list: List,
  image: ImageIcon,
  advert: Megaphone,
};

const ORDER: BlockType[] = ["paragraph", "heading", "list", "quote", "image", "advert"];

/**
 * The block-type picker. Used two ways: as the floating footer toolbar (variant
 * "bar") and as the per-block insert popover (variant "menu"). Calls `onPick`
 * with the chosen type.
 */
export function BlockPalette({
  onPick,
  variant = "bar",
}: {
  onPick: (type: BlockType) => void;
  variant?: "bar" | "menu";
}) {
  if (variant === "menu") {
    return (
      <div className="grid w-44 gap-1 rounded-lg border border-fp-line bg-white p-1.5 shadow-card">
        {ORDER.map((type) => {
          const Icon = BLOCK_ICONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onPick(type)}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-bold text-fp-ink hover:bg-fp-mint hover:text-fp-green"
            >
              <Icon className="h-4 w-4" />
              {BLOCK_LABELS[type]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-extrabold uppercase tracking-wide text-fp-muted">
        Add block
      </span>
      {ORDER.map((type) => {
        const Icon = BLOCK_ICONS[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onPick(type)}
            className="inline-flex items-center gap-1.5 rounded-md border border-fp-line bg-white px-3 py-2 text-sm font-bold text-fp-ink shadow-soft hover:border-fp-green hover:text-fp-green"
          >
            <Icon className="h-4 w-4" />
            {BLOCK_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}

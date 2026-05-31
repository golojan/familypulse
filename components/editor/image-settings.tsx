"use client";

import { AlignCenter, AlignLeft, AlignRight, Maximize2, type LucideIcon } from "lucide-react";
import { IMAGE_ALIGNMENTS, IMAGE_WIDTHS, type ImageAlign, type ImageWidth } from "@/lib/posts";

const ALIGN_ICON: Record<ImageAlign, LucideIcon> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
  full: Maximize2,
};

const WIDTH_LABEL: Record<ImageWidth, string> = {
  small: "S",
  medium: "M",
  large: "L",
  full: "Full",
};

/**
 * Alignment + size controls for an image block, shown as an overlay bar on the
 * image preview in the editor. Writes `align` / `width` back to the block.
 */
export function ImageSettings({
  align,
  width,
  onChange,
  disabled = false,
}: {
  align: ImageAlign;
  width: ImageWidth;
  onChange: (patch: { align?: ImageAlign; width?: ImageWidth }) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-fp-line bg-white/95 px-2 py-1.5 shadow-card backdrop-blur">
      <div className="flex items-center gap-0.5">
        {IMAGE_ALIGNMENTS.map((value) => {
          const Icon = ALIGN_ICON[value];
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              title={`Align ${value}`}
              aria-label={`Align ${value}`}
              onClick={() => onChange({ align: value })}
              className={`grid h-7 w-7 place-items-center rounded ${
                align === value ? "bg-fp-green text-white" : "text-fp-muted hover:bg-fp-mint"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
      <span className="h-5 w-px bg-fp-line" />
      <div className="flex items-center gap-0.5">
        {IMAGE_WIDTHS.map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled || (align === "full" && value !== "full")}
            title={`Width ${value}`}
            onClick={() => onChange({ width: value })}
            className={`grid h-7 min-w-7 place-items-center rounded px-1.5 text-[11px] font-extrabold disabled:opacity-30 ${
              width === value ? "bg-fp-green text-white" : "text-fp-muted hover:bg-fp-mint"
            }`}
          >
            {WIDTH_LABEL[value]}
          </button>
        ))}
      </div>
    </div>
  );
}

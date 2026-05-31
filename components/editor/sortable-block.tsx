"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { BLOCK_LABELS, type Block, type BlockType } from "@/lib/posts";
import { BLOCK_ICONS, BlockPalette } from "./block-palette";

/**
 * One draggable block panel. Provides the drag handle, a label, a per-block
 * "insert below" popover (the block palette), a delete button, and the editing
 * body for the block (rendered by the parent via `children`).
 */
export function SortableBlock({
  block,
  locked = false,
  onRemove,
  onInsertAfter,
  children,
}: {
  block: Block;
  locked?: boolean;
  onRemove: () => void;
  onInsertAfter: (type: BlockType) => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: locked,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = BLOCK_ICONS[block.type];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white p-4 shadow-soft ${
        isDragging ? "border-fp-green ring-2 ring-fp-green/20" : "border-fp-line"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-fp-muted">
          <button
            type="button"
            aria-label="Drag to reorder"
            title="Drag to reorder"
            disabled={locked}
            className="cursor-grab touch-none rounded text-fp-muted hover:text-fp-green active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Icon className="h-4 w-4" />
          {BLOCK_LABELS[block.type]}
        </span>
        <button
          type="button"
          aria-label="Delete block"
          title="Delete block"
          disabled={locked}
          onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-md border border-fp-line bg-white text-fp-muted hover:border-red-300 hover:text-red-600 disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {children}

      {/* Insert-below affordance: a hairline + button that reveals the palette. */}
      {locked ? null : (
        <div className="pointer-events-none absolute -bottom-3 left-0 right-0 flex justify-center">
          <div className="pointer-events-auto relative">
            <button
              type="button"
              aria-label="Insert block below"
              title="Insert block below"
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-6 w-6 place-items-center rounded-full border border-fp-line bg-white text-fp-muted opacity-0 shadow-soft transition group-hover:opacity-100 hover:border-fp-green hover:text-fp-green focus:opacity-100"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            {menuOpen ? (
              <div className="absolute left-1/2 top-8 z-40 -translate-x-1/2">
                <BlockPalette
                  variant="menu"
                  onPick={(type) => {
                    onInsertAfter(type);
                    setMenuOpen(false);
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

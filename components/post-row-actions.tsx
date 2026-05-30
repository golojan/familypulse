"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { deletePost, publishPost, unpublishPost } from "@/app/dashboard/posts/actions";

type PostRowActionsProps = {
  postId: string;
  status: "DRAFT" | "PUBLISHED";
};

/**
 * Inline draft/publish controls for a dashboard row. Each action is a server
 * action driven through a transition so the row reflects pending state and the
 * list revalidates on completion.
 */
export function PostRowActions({ postId, status }: PostRowActionsProps) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<void>) {
    startTransition(() => {
      void fn();
    });
  }

  function onDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    run(() => deletePost(postId));
  }

  return (
    <div className="flex items-center gap-2">
      {pending ? <Loader2 className="h-4 w-4 animate-spin text-fp-muted" /> : null}

      {status === "PUBLISHED" ? (
        <button
          type="button"
          onClick={() => run(() => unpublishPost(postId))}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-fp-line bg-white px-3 py-1.5 text-xs font-extrabold text-fp-ink hover:border-amber-400 hover:text-amber-700 disabled:opacity-50"
        >
          <EyeOff className="h-3.5 w-3.5" /> Unpublish
        </button>
      ) : (
        <button
          type="button"
          onClick={() => run(() => publishPost(postId))}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-fp-line bg-white px-3 py-1.5 text-xs font-extrabold text-fp-green hover:border-fp-green disabled:opacity-50"
        >
          <Eye className="h-3.5 w-3.5" /> Publish
        </button>
      )}

      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label="Delete post"
        title="Delete post"
        className="grid h-8 w-8 place-items-center rounded-md border border-fp-line bg-white text-fp-muted hover:border-red-300 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

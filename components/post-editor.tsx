"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Heading,
  Image as ImageIcon,
  List,
  Mic2,
  Plus,
  Quote,
  Save,
  Send,
  Text,
  Trash2,
  Video,
} from "lucide-react";
import {
  BLOCK_LABELS,
  createBlock,
  type Block,
  type BlockType,
} from "@/lib/posts";
import type { TopicOption } from "@/lib/topics-data";
import { savePost, type ActionState } from "@/app/dashboard/posts/actions";
import { MediaUploadField } from "./media-upload-field";

const INITIAL: ActionState = { ok: false };

const BLOCK_ICONS: Record<BlockType, typeof Text> = {
  heading: Heading,
  paragraph: Text,
  quote: Quote,
  list: List,
  image: ImageIcon,
};

type PostEditorProps = {
  postId?: string;
  initialTitle?: string;
  initialType?: "ARTICLE" | "VIDEO" | "PODCAST";
  initialCover?: string;
  initialVideoUrl?: string;
  initialAudioUrl?: string;
  initialTopicId?: string | null;
  initialBlocks?: Block[];
  status?: "DRAFT" | "PUBLISHED";
  topics?: TopicOption[];
};

export function PostEditor({
  postId = "",
  initialTitle = "",
  initialType = "ARTICLE",
  initialCover = "",
  initialVideoUrl = "",
  initialAudioUrl = "",
  initialTopicId = "",
  initialBlocks = [],
  status = "DRAFT",
  topics = [],
}: PostEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [postType, setPostType] = useState<"ARTICLE" | "VIDEO" | "PODCAST">(initialType);
  const [cover, setCover] = useState(initialCover);
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl);
  const [coverGenerating, setCoverGenerating] = useState(false);
  const [coverGenerationError, setCoverGenerationError] = useState("");
  const [topicId, setTopicId] = useState(initialTopicId ?? "");
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.length ? initialBlocks : [createBlock("paragraph")],
  );

  // Both submit buttons share one form; `mode` is bound per-button via the action.
  const saveDraft = useMemo(
    () => savePost.bind(null, postId, "draft"),
    [postId],
  );
  const publish = useMemo(() => savePost.bind(null, postId, "publish"), [postId]);

  const [draftState, draftAction] = useActionState(saveDraft, INITIAL);
  const [publishState, publishAction] = useActionState(publish, INITIAL);
  const titleError = draftState.fieldErrors?.title ?? publishState.fieldErrors?.title;
  const topicError = draftState.fieldErrors?.topic ?? publishState.fieldErrors?.topic;
  const formError = draftState.error ?? publishState.error;
  const isPublished = status === "PUBLISHED";

  function update(id: string, patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
    );
  }

  function add(type: BlockType) {
    setBlocks((prev) => [...prev, createBlock(type)]);
  }

  function remove(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function generateCoverFromVideo() {
    if (!videoUrl || isPublished) return;
    setCoverGenerating(true);
    setCoverGenerationError("");

    try {
      const blob = await captureVideoFrame(videoUrl);
      const uploadedUrl = await uploadGeneratedCover(blob);
      setCover(uploadedUrl);
    } catch (error) {
      setCoverGenerationError(
        error instanceof Error
          ? error.message
          : "Could not generate a cover from this video.",
      );
    } finally {
      setCoverGenerating(false);
    }
  }

  const serializedBlocks = JSON.stringify(blocks);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-fp-line bg-white p-4 shadow-card lg:col-span-2">
        <div>
          <p className="text-sm font-extrabold text-fp-ink">Post actions</p>
          <p className="mt-1 text-xs font-semibold text-fp-muted">
            {isPublished ? "Published posts are locked. Unpublish before editing or saving drafts." : "Save a draft or publish from here."}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={draftAction}>
            <HiddenFields audioUrl={audioUrl} blocks={serializedBlocks} cover={cover} postType={postType} title={title} topicId={topicId} videoUrl={videoUrl} />
            <SubmitButton disabled={isPublished} variant="secondary" icon={Save} label="Save draft" pendingLabel="Saving..." />
          </form>
          <form action={publishAction}>
            <HiddenFields audioUrl={audioUrl} blocks={serializedBlocks} cover={cover} postType={postType} title={title} topicId={topicId} videoUrl={videoUrl} />
            <SubmitButton disabled={isPublished} variant="primary" icon={Send} label={isPublished ? "Published" : "Publish"} pendingLabel="Publishing..." />
          </form>
        </div>
      </div>

      <div className="min-w-0">
        {/* Title + taxonomy live outside the per-block list but inside both submit forms. */}
        <div className="rounded-lg border border-fp-line bg-white p-5 shadow-card sm:p-6">
          <label className="mb-4 grid gap-2 text-sm font-extrabold text-fp-ink">
            Post type
            <select
              className="w-full rounded-md border border-fp-line bg-white px-4 py-2.5 text-sm font-semibold text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15"
              value={postType}
              disabled={isPublished}
              onChange={(e) => setPostType(e.target.value as "ARTICLE" | "VIDEO" | "PODCAST")}
            >
              <option value="ARTICLE">Article / Blog</option>
              <option value="VIDEO">Video</option>
              <option value="PODCAST">Podcast</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-fp-ink">
            Post title
            <input
              className="w-full rounded-md border border-fp-line bg-white px-4 py-3 text-lg font-bold text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15"
              value={title}
              disabled={isPublished}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A clear, specific headline"
            />
          </label>
          {titleError ? (
            <p className="mt-2 text-sm font-bold text-red-600" aria-live="polite">
              {titleError}
            </p>
          ) : null}

          <label className="mt-4 grid gap-2 text-sm font-extrabold text-fp-ink">
            Topic
            <select
              className="w-full rounded-md border border-fp-line bg-white px-4 py-2.5 text-sm font-semibold text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15"
              value={topicId}
              disabled={isPublished}
              onChange={(e) => setTopicId(e.target.value)}
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>
          {topicError ? (
            <p className="mt-2 text-sm font-bold text-red-600" aria-live="polite">
              {topicError}
            </p>
          ) : null}

          <label className="hidden">
            Cover image URL <span className="font-semibold text-fp-muted">(optional)</span>
            <input
              className="w-full rounded-md border border-fp-line bg-white px-4 py-2.5 text-sm font-semibold text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="https://…"
            />
          </label>
        </div>

        {/* Block list */}
        <div className="mt-5 grid gap-3">
          {blocks.map((block, index) => (
            <BlockCard
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              locked={isPublished}
              onChange={(patch) => update(block.id, patch)}
              onRemove={() => remove(block.id)}
              onMove={(dir) => move(index, dir)}
            />
          ))}
        </div>

        {isPublished ? null : <BlockAdder onAdd={add} />}
      </div>

      {/* Sidebar: media + submit actions. Two forms so each button posts its own mode. */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="grid gap-4">
          <div className="rounded-lg border border-fp-line bg-white p-5 shadow-card">
            <p className="text-sm font-extrabold text-fp-ink">Cover photo</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-fp-muted">
              Upload or drop an image to use as the post cover.
            </p>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="mt-3 aspect-video w-full rounded-md border border-fp-line object-cover" />
            ) : null}
            {isPublished ? null : (
              <div className="mt-3">
                <MediaUploadField accept="image/*" kind="IMAGE" label="Drop or upload cover" onUploaded={setCover} />
              </div>
            )}
          </div>

          {postType === "VIDEO" ? (
            <div className="rounded-lg border border-fp-line bg-white p-5 shadow-card">
              <p className="flex items-center gap-2 text-sm font-extrabold text-fp-ink">
                <Video className="h-4 w-4 text-fp-green" />
                Video source
              </p>
              <label className="mt-3 grid gap-2 text-xs font-extrabold uppercase text-fp-muted">
                YouTube or uploaded video URL
                <input
                  className="w-full rounded-md border border-fp-line bg-white px-3 py-2 text-sm font-semibold normal-case text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15"
                  value={videoUrl}
                  disabled={isPublished}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  placeholder="https://youtube.com/..."
                />
              </label>
              {isPublished ? null : (
                <div className="mt-3 grid gap-3">
                  <MediaUploadField accept="video/*" kind="VIDEO" label="Drop or upload video" onUploaded={setVideoUrl} />
                  <button
                    type="button"
                    onClick={generateCoverFromVideo}
                    disabled={!videoUrl || coverGenerating}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-fp-line bg-white px-3 text-sm font-extrabold text-fp-ink shadow-soft hover:border-fp-green hover:text-fp-green disabled:opacity-50"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {coverGenerating ? "Generating cover..." : "Generate cover from video"}
                  </button>
                  {coverGenerationError ? (
                    <p className="text-xs font-bold text-red-600">{coverGenerationError}</p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {postType === "PODCAST" ? (
            <div className="rounded-lg border border-fp-line bg-white p-5 shadow-card">
              <p className="flex items-center gap-2 text-sm font-extrabold text-fp-ink">
                <Mic2 className="h-4 w-4 text-fp-green" />
                Podcast audio
              </p>
              <label className="mt-3 grid gap-2 text-xs font-extrabold uppercase text-fp-muted">
                Audio URL
                <input
                  className="w-full rounded-md border border-fp-line bg-white px-3 py-2 text-sm font-semibold normal-case text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15"
                  value={audioUrl}
                  disabled={isPublished}
                  onChange={(event) => setAudioUrl(event.target.value)}
                  placeholder="https://..."
                />
              </label>
              {isPublished ? null : (
                <div className="mt-3">
                  <MediaUploadField accept="audio/*" kind="AUDIO" label="Drop or upload audio" onUploaded={setAudioUrl} />
                </div>
              )}
            </div>
          ) : null}

        <div className="rounded-lg border border-fp-line bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-fp-ink">Status</span>
            <StatusPill status={status} />
          </div>

          {formError ? (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-600" aria-live="polite">
              {formError}
            </p>
          ) : null}

          <p className="mt-3 text-sm font-semibold leading-6 text-fp-muted">
            Save your work as a draft, or publish it to make it live on FamilyPulse.
          </p>

          <div className={`mt-5 grid gap-3 ${isPublished ? "pointer-events-none opacity-60" : ""}`}>
            <form action={draftAction}>
              <HiddenFields audioUrl={audioUrl} blocks={serializedBlocks} cover={cover} postType={postType} title={title} topicId={topicId} videoUrl={videoUrl} />
              <SubmitButton variant="secondary" icon={Save} label="Save draft" pendingLabel="Saving…" />
            </form>

            <form action={publishAction}>
              <HiddenFields audioUrl={audioUrl} blocks={serializedBlocks} cover={cover} postType={postType} title={title} topicId={topicId} videoUrl={videoUrl} />
              <SubmitButton
                variant="primary"
                icon={Send}
                label={status === "PUBLISHED" ? "Update & republish" : "Publish"}
                pendingLabel="Publishing…"
              />
            </form>
          </div>
        </div>
        </div>
      </aside>
    </div>
  );
}

function HiddenFields({
  title,
  cover,
  topicId,
  postType,
  videoUrl,
  audioUrl,
  blocks,
}: {
  title: string;
  cover: string;
  topicId: string;
  postType: "ARTICLE" | "VIDEO" | "PODCAST";
  videoUrl: string;
  audioUrl: string;
  blocks: string;
}) {
  return (
    <>
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="coverImage" value={cover} />
      <input type="hidden" name="topicId" value={topicId} />
      <input type="hidden" name="type" value={postType} />
      <input type="hidden" name="videoUrl" value={videoUrl} />
      <input type="hidden" name="audioUrl" value={audioUrl} />
      <input type="hidden" name="blocks" value={blocks} />
    </>
  );
}

type GeneratedCoverPresignResponse = {
  uploadUrl: string;
  contentType: string;
  media: {
    id: string;
    url: string;
  };
  error?: string;
};

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

function SubmitButton({
  variant,
  icon: Icon,
  label,
  pendingLabel,
  disabled = false,
}: {
  variant: "primary" | "secondary";
  icon: typeof Save;
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const styles =
    variant === "primary"
      ? "bg-fp-green !text-white shadow-green"
      : "border border-fp-line bg-white text-fp-ink shadow-soft";
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-extrabold disabled:opacity-60 ${styles}`}
    >
      <Icon className="h-4 w-4" />
      {pending ? pendingLabel : label}
    </button>
  );
}

function StatusPill({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-extrabold ${
        published ? "bg-fp-green/10 text-fp-green" : "bg-amber-100 text-amber-700"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function BlockAdder({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-fp-line bg-white/60 p-3">
      <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-fp-muted">
        Add block
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(BLOCK_LABELS) as BlockType[]).map((type) => {
          const Icon = BLOCK_ICONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onAdd(type)}
              className="inline-flex items-center gap-1.5 rounded-md border border-fp-line bg-white px-3 py-2 text-sm font-bold text-fp-ink shadow-soft hover:border-fp-green hover:text-fp-green"
            >
              <Icon className="h-4 w-4" />
              {BLOCK_LABELS[type]}
              <Plus className="h-3.5 w-3.5 opacity-60" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BlockCard({
  block,
  index,
  total,
  locked = false,
  onChange,
  onRemove,
  onMove,
}: {
  block: Block;
  index: number;
  total: number;
  locked?: boolean;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const Icon = BLOCK_ICONS[block.type];
  return (
    <div className="group rounded-lg border border-fp-line bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-fp-muted">
          <GripVertical className="h-4 w-4" />
          <Icon className="h-4 w-4" />
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn label="Move up" disabled={locked || index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Move down" disabled={locked || index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Delete block" disabled={locked} onClick={onRemove} danger>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>
      <BlockBody block={block} readOnly={locked} onChange={onChange} />
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-md border border-fp-line bg-white text-fp-muted disabled:opacity-30 ${
        danger ? "hover:border-red-300 hover:text-red-600" : "hover:border-fp-green hover:text-fp-green"
      }`}
    >
      {children}
    </button>
  );
}

const FIELD =
  "w-full rounded-md border border-fp-line bg-white px-3 py-2 text-sm font-semibold text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15";

function BlockBody({
  block,
  onChange,
  readOnly = false,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  readOnly?: boolean;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="grid gap-2">
          <input
            className={`${FIELD} text-base font-bold`}
            value={block.text}
            disabled={readOnly}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Heading text"
          />
          <div className="flex gap-2">
            {([2, 3] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                disabled={readOnly}
                onClick={() => onChange({ level: lvl })}
                className={`rounded-md px-3 py-1.5 text-xs font-extrabold ${
                  block.level === lvl
                    ? "bg-fp-green !text-white"
                    : "border border-fp-line bg-white text-fp-muted"
                }`}
              >
                H{lvl}
              </button>
            ))}
          </div>
        </div>
      );

    case "paragraph":
      return (
        <textarea
          className={`${FIELD} min-h-24 resize-y leading-6`}
          value={block.text}
          disabled={readOnly}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Write a paragraph…"
        />
      );

    case "quote":
      return (
        <div className="grid gap-2">
          <textarea
            className={`${FIELD} min-h-20 resize-y italic`}
            value={block.text}
            disabled={readOnly}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Quoted text…"
          />
          <input
            className={FIELD}
            value={block.cite ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ cite: e.target.value })}
            placeholder="Attribution (optional)"
          />
        </div>
      );

    case "list":
      return <ListEditor block={block} readOnly={readOnly} onChange={onChange} />;

    case "image":
      return (
        <div className="grid gap-2">
          <input
            className={FIELD}
            value={block.url}
            disabled={readOnly}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="Image URL (https://…)"
          />
          <input
            className={FIELD}
            value={block.alt ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt text (for accessibility)"
          />
          <input
            className={FIELD}
            value={block.caption ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="Caption (optional)"
          />
          {block.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.url}
              alt={block.alt ?? ""}
              className="mt-1 max-h-48 w-full rounded-md border border-fp-line object-cover"
            />
          ) : null}
        </div>
      );
  }
}

function ListEditor({
  block,
  onChange,
  readOnly = false,
}: {
  block: Extract<Block, { type: "list" }>;
  onChange: (patch: Partial<Block>) => void;
  readOnly?: boolean;
}) {
  function setItem(i: number, value: string) {
    const items = [...block.items];
    items[i] = value;
    onChange({ items });
  }
  function addItem() {
    onChange({ items: [...block.items, ""] });
  }
  function removeItem(i: number) {
    onChange({ items: block.items.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        {[
          { ordered: false, label: "Bulleted" },
          { ordered: true, label: "Numbered" },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            disabled={readOnly}
            onClick={() => onChange({ ordered: opt.ordered })}
            className={`rounded-md px-3 py-1.5 text-xs font-extrabold ${
              block.ordered === opt.ordered
                ? "bg-fp-green !text-white"
                : "border border-fp-line bg-white text-fp-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center text-sm font-bold text-fp-muted">
            {block.ordered ? `${i + 1}.` : "•"}
          </span>
          <input
            className={FIELD}
            value={item}
            disabled={readOnly}
            onChange={(e) => setItem(i, e.target.value)}
            placeholder={`Item ${i + 1}`}
          />
          <IconBtn label="Remove item" disabled={readOnly} onClick={() => removeItem(i)} danger>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      ))}
      <button
        type="button"
        disabled={readOnly}
        onClick={addItem}
        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-fp-line bg-white px-3 py-1.5 text-xs font-extrabold text-fp-ink hover:border-fp-green hover:text-fp-green"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  );
}

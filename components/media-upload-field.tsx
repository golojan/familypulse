"use client";

import { type DragEvent, useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";

type MediaUploadFieldProps = {
  label: string;
  accept: string;
  kind?: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  onUploaded: (url: string) => void;
};

type PresignResponse = {
  uploadUrl: string;
  contentType: string;
  media: {
    id: string;
    url: string;
  };
  error?: string;
};

export function MediaUploadField({ label, accept, kind, onUploaded }: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    setState("uploading");
    setMessage("");

    try {
      const presign = await fetch("/api/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          kind,
        }),
      });
      const signed = (await presign.json()) as PresignResponse;

      if (!presign.ok) {
        throw new Error(signed.error ?? "Could not prepare upload.");
      }

      const uploadResponse = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": signed.contentType },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload to storage failed.");
      }

      await fetch(`/api/media/${signed.media.id}/complete`, { method: "POST" });
      onUploaded(signed.media.url);
      setState("done");
      setMessage("Uploaded");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event: DragEvent<HTMLButtonElement>) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: DragEvent<HTMLButtonElement>) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        disabled={state === "uploading"}
        className={`inline-flex min-h-24 items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm font-extrabold disabled:opacity-60 ${
          dragging ? "border-fp-green bg-fp-mint text-fp-green" : "border-fp-line bg-fp-soft text-fp-ink hover:border-fp-green hover:text-fp-green"
        }`}
      >
        {state === "uploading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {state === "uploading" ? "Uploading..." : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {message ? (
        <p className={`text-xs font-bold ${state === "error" ? "text-red-600" : "text-fp-green"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import type { ReferenceImage } from "./types";

export function ReferenceUploader({
  images,
  onChange,
  max = 6,
}: {
  images: ReferenceImage[];
  onChange: (next: ReferenceImage[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const remaining = max - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    const uploaded: ReferenceImage[] = [];
    for (const file of toUpload) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Upload failed.");
          continue;
        }
        uploaded.push(data as ReferenceImage);
      } catch {
        setError("Upload failed. Please try again.");
      }
    }
    onChange([...images, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img) => (
          <div
            key={img.url}
            className="group relative aspect-square overflow-hidden rounded-lg border border-ink-line bg-ink-raised"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.fileName} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((i) => i.url !== img.url))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-bone opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`Remove ${img.fileName}`}
            >
              ✕
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-line text-bone-muted transition-colors hover:border-vermilion hover:text-bone disabled:opacity-50"
          >
            <span className="text-xl">{uploading ? "…" : "+"}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest">
              {uploading ? "Uploading" : "Add"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-xs text-vermilion-soft">{error}</p>}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        Up to {max} images · JPG / PNG / WEBP · 8 MB each
      </p>
    </div>
  );
}

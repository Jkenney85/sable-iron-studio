"use client";

import { useState, useTransition } from "react";
import { deleteArtist } from "@/lib/admin-actions";

export function DeleteArtistButton({
  artistId,
  artistName,
}: {
  artistId: string;
  artistName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    if (
      !window.confirm(
        `Permanently delete ${artistName}? This removes their profile, availability and portfolio. This can't be undone.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteArtist(artistId);
        // On success the action redirects; nothing else to do here.
      } catch (err) {
        // redirect() throws a special error that Next handles — ignore it.
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setError(err instanceof Error ? err.message : "Could not delete artist.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-full border border-red-500/40 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete artist"}
      </button>
      {error && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

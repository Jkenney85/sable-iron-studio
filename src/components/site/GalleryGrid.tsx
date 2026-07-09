"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { clsx } from "clsx";

export type GalleryItem = {
  id: string;
  imageUrl: string;
  title: string;
  style: string | null;
  artistName: string | null;
  artistSlug: string | null;
};

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const styles = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.style && set.add(i.style));
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const [active, setActive] = useState("All");
  const filtered =
    active === "All" ? items : items.filter((i) => i.style === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {styles.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActive(s)}
            className={clsx(
              "rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors",
              active === s
                ? "border-vermilion bg-vermilion text-ink"
                : "border-ink-line text-bone-muted hover:border-bone-muted hover:text-bone"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center font-mono text-sm text-bone-muted">
          No pieces in this style yet.
        </p>
      ) : (
        <div className="mt-10 columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
          {filtered.map((item) => (
            <figure
              key={item.id}
              className="group relative break-inside-avoid overflow-hidden rounded-xl bg-ink-soft"
            >
              <Image
                src={item.imageUrl}
                alt={item.title || "Tattoo"}
                width={600}
                height={800}
                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/90 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {item.style && (
                  <div className="font-mono text-[10px] uppercase tracking-widest text-vermilion">
                    {item.style}
                  </div>
                )}
                {item.artistSlug && item.artistName && (
                  <Link
                    href={`/artists/${item.artistSlug}`}
                    className="font-display text-lg text-bone hover:text-vermilion"
                  >
                    {item.artistName}
                  </Link>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

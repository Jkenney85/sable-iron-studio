import type { Metadata } from "next";
import { getPortfolio } from "@/lib/queries";
import { GalleryGrid, type GalleryItem } from "@/components/site/GalleryGrid";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Recent custom tattoo work from the Sable & Iron artists.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const portfolio = await getPortfolio();
  const items: GalleryItem[] = portfolio.map((p) => ({
    id: p.id,
    imageUrl: p.imageUrl,
    title: p.title,
    style: p.style,
    artistName: p.artist?.name ?? null,
    artistSlug: p.artist?.slug ?? null,
  }));

  return (
    <div className="container-editorial py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="kicker">Portfolio</p>
        <h1 className="mt-4 text-balance font-display text-5xl md:text-7xl">
          The book.
        </h1>
        <p className="mt-6 text-lg text-bone-muted">
          A cross-section of recent healed and fresh work. Filter by style, then
          find the artist behind the piece.
        </p>
      </header>

      <div className="mt-14">
        {items.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="font-display text-2xl text-bone-muted">
              The gallery is being curated.
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-bone-muted">
              Check back soon
            </p>
          </div>
        ) : (
          <GalleryGrid items={items} />
        )}
      </div>
    </div>
  );
}

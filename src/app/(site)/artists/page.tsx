import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArtists } from "@/lib/queries";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Artists",
  description: "Meet the resident and guest artists at Sable & Iron.",
};

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="container-editorial py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="kicker">The roster</p>
        <h1 className="mt-4 text-balance font-display text-5xl md:text-7xl">
          Four hands, four voices, one standard.
        </h1>
        <p className="mt-6 text-lg text-bone-muted">
          Every artist here works custom and by appointment. Find the one whose
          style fits your idea — then book straight from their page.
        </p>
      </header>

      <div className="mt-16 space-y-6">
        {artists.map((artist, i) => (
          <Reveal key={artist.id} delay={i * 60}>
            <Link
              href={`/artists/${artist.slug}`}
              className="group grid items-stretch gap-0 overflow-hidden rounded-2xl border border-ink-line bg-ink-soft transition-colors hover:border-bone-muted/40 md:grid-cols-[320px_1fr]"
            >
              <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
                {artist.avatarUrl && (
                  <Image
                    src={artist.avatarUrl}
                    alt={artist.name}
                    fill
                    className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                  />
                )}
              </div>
              <div className="flex flex-col justify-between gap-6 p-8 md:p-10">
                <div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h2 className="font-display text-3xl md:text-4xl">{artist.name}</h2>
                    {artist.pronouns && (
                      <span className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
                        {artist.pronouns}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-vermilion">
                    {artist.title}
                  </div>
                  <p className="mt-5 max-w-2xl leading-relaxed text-bone-muted">
                    {artist.bio}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {artist.styles.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-ink-line px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-bone-soft"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-bone-muted transition-colors group-hover:text-vermilion">
                    View profile ↗
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

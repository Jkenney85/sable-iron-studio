import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtistBySlug } from "@/lib/queries";
import { Reveal } from "@/components/site/Reveal";
import { minutesToLabel, formatMoney, formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const artist = await getArtistBySlug(params.slug);
  if (!artist) return { title: "Artist not found" };
  return {
    title: artist.name,
    description: artist.bio.slice(0, 150),
  };
}

export default async function ArtistDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const artist = await getArtistBySlug(params.slug);
  if (!artist || !artist.active) notFound();

  const types = artist.appointmentTypes.map((a) => a.appointmentType);

  // Group availability windows by day for a readable weekly summary.
  const byDay = new Map<number, { start: number; end: number }[]>();
  for (const w of artist.availability) {
    const arr = byDay.get(w.dayOfWeek) ?? [];
    arr.push({ start: w.startMinutes, end: w.endMinutes });
    byDay.set(w.dayOfWeek, arr);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[52vh] min-h-[380px] overflow-hidden">
        {artist.heroUrl && (
          <Image
            src={artist.heroUrl}
            alt={`${artist.name}'s work`}
            fill
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
        <div className="container-editorial relative flex h-full flex-col justify-end pb-10">
          <Link
            href="/artists"
            className="mb-6 font-mono text-[11px] uppercase tracking-widest text-bone-muted hover:text-bone"
          >
            ← All artists
          </Link>
          <p className="kicker">{artist.title}</p>
          <h1 className="mt-3 font-display text-5xl md:text-7xl">{artist.name}</h1>
        </div>
      </section>

      <div className="container-editorial grid gap-14 py-16 md:grid-cols-[1fr_320px] md:py-24">
        {/* Main column */}
        <div>
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
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-bone-soft">
            {artist.bio}
          </p>

          {/* Portfolio */}
          {artist.portfolio.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-3xl">Selected work</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                {artist.portfolio.map((p, i) => (
                  <Reveal
                    key={p.id}
                    delay={i * 50}
                    className="relative aspect-square overflow-hidden rounded-xl bg-ink-soft"
                  >
                    <Image
                      src={p.imageUrl}
                      alt={p.title || `${artist.name} tattoo`}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: booking + availability */}
        <aside className="space-y-6 md:sticky md:top-28 md:self-start">
          <div className="card p-6">
            <div className="kicker">Book with {artist.name.split(" ")[0]}</div>
            {artist.bookingOpen ? (
              <>
                <p className="mt-3 text-sm text-bone-muted">
                  Choose a service and grab a time from {artist.name.split(" ")[0]}
                  &apos;s live calendar.
                </p>
                <Link
                  href={`/book?artist=${artist.slug}`}
                  className="btn-primary mt-5 w-full"
                >
                  Book now
                </Link>
              </>
            ) : (
              <p className="mt-3 rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm text-bone-muted">
                {artist.name.split(" ")[0]}&apos;s books are currently closed.
                Check back soon or reach out via contact.
              </p>
            )}
          </div>

          {types.length > 0 && (
            <div className="card p-6">
              <div className="kicker">Services offered</div>
              <ul className="mt-4 space-y-3">
                {types.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-bone">{t.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                        {formatDuration(t.durationMinutes)}
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-sm text-vermilion">
                      {t.priceCents > 0 ? formatMoney(t.priceCents) : "Quote"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-6">
            <div className="kicker">Typical hours</div>
            <ul className="mt-4 space-y-2">
              {DAYS.map((label, day) => {
                const windows = byDay.get(day);
                return (
                  <li
                    key={day}
                    className="flex items-center justify-between font-mono text-xs"
                  >
                    <span className="uppercase tracking-widest text-bone-muted">
                      {label}
                    </span>
                    <span className={windows ? "text-bone" : "text-bone-muted/50"}>
                      {windows
                        ? windows
                            .map(
                              (w) =>
                                `${minutesToLabel(w.start)}–${minutesToLabel(w.end)}`
                            )
                            .join(", ")
                        : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-bone-muted">
              Exact openings depend on existing bookings. Available times show
              during booking.
            </p>
          </div>

          {artist.instagram && (
            <a
              href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="block text-center font-mono text-xs uppercase tracking-widest text-bone-muted hover:text-vermilion"
            >
              {artist.instagram} ↗
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}

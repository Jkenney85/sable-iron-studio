import Image from "next/image";
import Link from "next/link";
import { getArtists, getAppointmentTypes, getPortfolio, getStudio } from "@/lib/queries";
import { Reveal } from "@/components/site/Reveal";
import { formatMoney, formatDuration } from "@/lib/format";
import { policyLabel } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const HERO_IMG =
  "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1600&q=80";
const STUDIO_IMG =
  "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=1200&q=80";

const STYLE_WORDS = [
  "Blackwork",
  "Fine line",
  "Neo-traditional",
  "Dotwork",
  "Ornamental",
  "Micro-realism",
  "Illustrative",
  "Lettering",
];

export default async function HomePage() {
  const [studio, artists, types, portfolio] = await Promise.all([
    getStudio(),
    getArtists(),
    getAppointmentTypes(),
    getPortfolio(8),
  ]);

  return (
    <div className="relative">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <Image
          src={HERO_IMG}
          alt="A tattoo in progress at Sable & Iron"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-transparent" />

        <div className="container-editorial relative flex min-h-[92vh] flex-col justify-end pb-16 pt-28 md:pb-24">
          <p className="kicker animate-fade-in">
            Portland · Est. 2016 · By appointment
          </p>
          <h1 className="mt-6 max-w-4xl text-balance font-display text-5xl leading-[0.95] animate-fade-up sm:text-7xl md:text-8xl">
            Ink that earns
            <br />
            its place on <span className="italic text-vermilion">skin.</span>
          </h1>
          <p
            className="mt-8 max-w-xl text-lg leading-relaxed text-bone-soft animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            {studio.about?.split(".")[0] ||
              "A five-chair private studio for custom tattooing"}
            . Drawn for you, done properly, no flash walls.
          </p>
          <div
            className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
            style={{ animationDelay: "220ms" }}
          >
            <Link href="/book" className="btn-primary">
              Book your appointment
            </Link>
            <Link href="/artists" className="btn-outline">
              Meet the artists
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-6 right-6 hidden font-mono text-[11px] uppercase tracking-widest text-bone-muted md:block">
          Scroll ↓
        </div>
      </section>

      {/* ── Style marquee ────────────────────────────────────── */}
      <section className="border-y border-ink-line bg-ink-soft py-5">
        <div className="flex overflow-hidden">
          <div className="flex shrink-0 animate-marquee items-center gap-8 whitespace-nowrap pr-8">
            {[...STYLE_WORDS, ...STYLE_WORDS].map((w, i) => (
              <span key={i} className="flex items-center gap-8 font-display text-2xl text-bone-muted">
                {w}
                <span className="text-vermilion">✦</span>
              </span>
            ))}
          </div>
          <div
            className="flex shrink-0 animate-marquee items-center gap-8 whitespace-nowrap pr-8"
            aria-hidden
          >
            {[...STYLE_WORDS, ...STYLE_WORDS].map((w, i) => (
              <span key={i} className="flex items-center gap-8 font-display text-2xl text-bone-muted">
                {w}
                <span className="text-vermilion">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── About split ──────────────────────────────────────── */}
      <section className="container-editorial grid items-center gap-12 py-24 md:grid-cols-2 md:py-32">
        <Reveal>
          <p className="kicker">The studio</p>
          <h2 className="mt-4 text-balance font-display text-4xl md:text-5xl">
            We don't do walk-ins. We do work worth waiting for.
          </h2>
          <p className="mt-6 leading-relaxed text-bone-muted">
            {studio.about}
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-ink-line pt-8">
            {[
              ["10+", "Years open"],
              ["4", "Resident artists"],
              ["100%", "Custom work"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-4xl text-vermilion">{n}</dt>
                <dd className="mt-1 font-mono text-[11px] uppercase tracking-widest text-bone-muted">
                  {l}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={120} className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          <Image
            src={STUDIO_IMG}
            alt="Inside the Sable & Iron studio"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
        </Reveal>
      </section>

      {/* ── Artists ──────────────────────────────────────────── */}
      <section className="container-editorial py-8 md:py-16">
        <div className="flex items-end justify-between border-b border-ink-line pb-6">
          <div>
            <p className="kicker">The artists</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Hands you can trust</h2>
          </div>
          <Link
            href="/artists"
            className="hidden font-mono text-xs uppercase tracking-widest text-bone-muted hover:text-vermilion md:block"
          >
            All artists ↗
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {artists.map((artist, i) => (
            <Reveal key={artist.id} delay={i * 80}>
              <Link href={`/artists/${artist.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink-soft">
                  {artist.avatarUrl && (
                    <Image
                      src={artist.avatarUrl}
                      alt={artist.name}
                      fill
                      className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="font-display text-2xl">{artist.name}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-vermilion">
                      {artist.styles.slice(0, 2).join(" · ")}
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Appointment types / booking teaser ───────────────── */}
      <section className="container-editorial py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="kicker">Booking</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              Straightforward from idea to appointment.
            </h2>
            <p className="mt-6 leading-relaxed text-bone-muted">
              Pick a service, choose your artist and a time from their real
              calendar, share your idea, and hold the chair with a deposit — all
              in a few minutes.
            </p>
            <Link href="/book" className="btn-primary mt-8">
              Start booking
            </Link>
            {studio.depositPolicy && (
              <p className="mt-6 max-w-sm text-xs leading-relaxed text-bone-muted">
                {studio.depositPolicy}
              </p>
            )}
          </Reveal>

          <div className="space-y-3">
            {types.map((t, i) => (
              <Reveal key={t.id} delay={i * 60}>
                <div className="card flex items-center justify-between gap-6 p-5 transition-colors hover:border-bone-muted/40">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="font-display text-xl">{t.name}</span>
                    </div>
                    <p className="mt-2 max-w-md text-sm text-bone-muted">
                      {t.description}
                    </p>
                    <div className="mt-3 font-mono text-[11px] uppercase tracking-widest text-bone-muted">
                      {formatDuration(t.durationMinutes)} · {policyLabel(t.paymentPolicy)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-2xl text-vermilion">
                      {t.priceCents > 0 ? formatMoney(t.priceCents, studio.currency) : "Quote"}
                    </div>
                    {t.depositCents > 0 && (
                      <div className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                        {formatMoney(t.depositCents, studio.currency)} deposit
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery strip ────────────────────────────────────── */}
      {portfolio.length > 0 && (
        <section className="border-t border-ink-line py-8">
          <div className="container-editorial flex items-end justify-between pb-6">
            <div>
              <p className="kicker">Recent work</p>
              <h2 className="mt-3 font-display text-4xl md:text-5xl">From the book</h2>
            </div>
            <Link
              href="/gallery"
              className="hidden font-mono text-xs uppercase tracking-widest text-bone-muted hover:text-vermilion md:block"
            >
              Full gallery ↗
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 px-2 md:grid-cols-4">
            {portfolio.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href="/gallery"
                className="group relative aspect-square overflow-hidden bg-ink-soft"
              >
                <Image
                  src={p.imageUrl}
                  alt={p.title || "Tattoo"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA band ─────────────────────────────────────────── */}
      <section className="container-editorial py-24 md:py-32">
        <Reveal className="relative overflow-hidden rounded-3xl border border-ink-line bg-gradient-to-br from-oxblood/40 via-ink-soft to-ink p-10 md:p-16">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-balance font-display text-4xl md:text-6xl">
              Bring us the idea. We'll draw the rest.
            </h2>
            <p className="mt-6 text-lg text-bone-soft">
              Consultations, small pieces, or full-day sessions — book online in
              minutes.
            </p>
            <Link href="/book" className="btn-primary mt-8">
              Book your appointment
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-vermilion/20 blur-3xl" />
        </Reveal>
      </section>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { createArtist } from "@/lib/admin-actions";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

export default async function AdminArtistsPage() {
  const artists = await prisma.artist.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { bookings: true, availability: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Artists" subtitle="Profiles, booking status and calendars." />

      {/* Add a new artist. New profiles start hidden + closed to bookings so you
          can fill in the details before they go live. */}
      <details className="card mb-6 p-5 [&_summary]:cursor-pointer">
        <summary className="flex items-center justify-between font-display text-lg marker:content-none">
          <span>Add an artist</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-vermilion">
            + New
          </span>
        </summary>
        <form
          action={createArtist}
          className="mt-5 flex flex-wrap items-end gap-3 border-t border-ink-line pt-5"
        >
          <div className="min-w-[200px] flex-1">
            <label className="field-label">Name *</label>
            <input name="name" required className="field" placeholder="e.g. Alex Rivera" />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="field-label">Styles (comma-separated)</label>
            <input name="styles" className="field" placeholder="Blackwork, Fine line" />
          </div>
          <div className="min-w-[160px]">
            <label className="field-label">Title</label>
            <input name="title" className="field" placeholder="Resident Artist" />
          </div>
          <button type="submit" className="btn-primary">
            Create &amp; edit →
          </button>
        </form>
      </details>

      {artists.length === 0 ? (
        <EmptyState title="No artists yet" hint="Add your first artist above" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {artists.map((a) => (
            <Link
              key={a.id}
              href={`/admin/artists/${a.id}`}
              className="card flex items-center gap-4 p-4 transition-colors hover:border-bone-muted/40"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-ink-raised">
                {a.avatarUrl && (
                  <Image src={a.avatarUrl} alt={a.name} fill className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-display text-lg">{a.name}</span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                  {a._count.bookings} bookings · {a._count.availability} windows
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={clsx(
                    "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                    a.active
                      ? "border-emerald-500/40 text-emerald-400"
                      : "border-bone-muted/40 text-bone-muted"
                  )}
                >
                  {a.active ? "Active" : "Hidden"}
                </span>
                <span
                  className={clsx(
                    "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                    a.bookingOpen
                      ? "border-vermilion/50 text-vermilion"
                      : "border-bone-muted/40 text-bone-muted"
                  )}
                >
                  {a.bookingOpen ? "Booking open" : "Booking closed"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

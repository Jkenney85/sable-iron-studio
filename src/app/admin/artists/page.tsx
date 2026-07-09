import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/admin/ui";
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

      {artists.length === 0 ? (
        <EmptyState title="No artists yet" hint="Seed demo data to get started" />
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

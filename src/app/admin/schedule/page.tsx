import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatusBadge, EmptyState } from "@/components/admin/ui";
import { formatTime, formatDuration } from "@/lib/format";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function dayKey(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function SchedulePage() {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(now.getDate() + 21);

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), lte: horizon },
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT, BookingStatus.COMPLETED],
      },
    },
    orderBy: { startTime: "asc" },
    include: { artist: true, appointmentType: true, customer: true },
  });

  // Group by calendar day.
  const groups = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key = dayKey(b.startTime);
    const arr = groups.get(key) ?? [];
    arr.push(b);
    groups.set(key, arr);
  }

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Confirmed and pending appointments for the next three weeks."
      />

      {groups.size === 0 ? (
        <EmptyState
          title="A clear calendar"
          hint="No upcoming appointments in the next 21 days"
        />
      ) : (
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([day, items]) => (
            <section key={day}>
              <div className="mb-3 flex items-baseline gap-3 border-b border-ink-line pb-2">
                <h2 className="font-display text-xl">{day}</h2>
                <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                  {items.length} appt{items.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center gap-4 rounded-xl border border-ink-line bg-ink-soft p-3 transition-colors hover:border-bone-muted/40"
                  >
                    <div
                      className="h-10 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: b.appointmentType.color }}
                    />
                    <div className="w-20 shrink-0">
                      <div className="font-mono text-sm text-bone">{formatTime(b.startTime)}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                        {formatDuration(b.appointmentType.durationMinutes)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-bone">
                        {b.customer.name} · {b.appointmentType.name}
                      </div>
                      <div className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
                        {b.artist.name}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

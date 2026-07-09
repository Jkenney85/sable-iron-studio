import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/admin/ui";
import { formatMoney, formatDate, formatTime } from "@/lib/format";
import { BookingStatus, PaymentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [upcoming, todays, awaitingPayment, paidAgg, recent] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT] },
        startTime: { gte: now },
      },
      orderBy: { startTime: "asc" },
      take: 6,
      include: { artist: true, appointmentType: true, customer: true },
    }),
    prisma.booking.count({
      where: {
        status: BookingStatus.CONFIRMED,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.booking.count({ where: { status: BookingStatus.AWAITING_PAYMENT } }),
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: PaymentStatus.PAID },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { artist: true, appointmentType: true, customer: true },
    }),
  ]);

  const confirmedCount = await prisma.booking.count({
    where: { status: BookingStatus.CONFIRMED, startTime: { gte: now } },
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today at a glance, and what's coming up."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Today" value={todays} hint="confirmed appointments" />
        <StatCard label="Upcoming" value={confirmedCount} hint="confirmed, future" />
        <StatCard label="Awaiting payment" value={awaitingPayment} hint="not yet paid" />
        <StatCard
          label="Collected"
          value={formatMoney(paidAgg._sum.amountCents ?? 0)}
          hint="all paid deposits & payments"
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Upcoming */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Next up</h2>
            <Link
              href="/admin/schedule"
              className="font-mono text-[11px] uppercase tracking-widest text-bone-muted hover:text-vermilion"
            >
              Schedule ↗
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing scheduled" hint="New bookings will appear here" />
          ) : (
            <div className="space-y-2">
              {upcoming.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="card flex items-center justify-between gap-4 p-4 transition-colors hover:border-bone-muted/40"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-bone">
                      {b.customer.name} · {b.appointmentType.name}
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
                      {b.artist.name} · {formatDate(b.startTime)} · {formatTime(b.startTime)}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Recently booked</h2>
            <Link
              href="/admin/bookings"
              className="font-mono text-[11px] uppercase tracking-widest text-bone-muted hover:text-vermilion"
            >
              All bookings ↗
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="No bookings yet" hint="Seed demo data or take a test booking" />
          ) : (
            <div className="space-y-2">
              {recent.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="card flex items-center justify-between gap-4 p-4 transition-colors hover:border-bone-muted/40"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-bone">{b.customer.name}</div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
                      {b.reference} · {formatMoney(b.amountDueCents, b.currency)}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatusBadge, EmptyState } from "@/components/admin/ui";
import { formatMoney, formatDate, formatTime } from "@/lib/format";
import { BookingStatus, Prisma } from "@prisma/client";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string; where?: Prisma.BookingWhereInput }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming", where: { startTime: { gte: new Date() }, status: { notIn: [BookingStatus.CANCELLED] } } },
  { key: "confirmed", label: "Confirmed", where: { status: BookingStatus.CONFIRMED } },
  { key: "awaiting", label: "Awaiting payment", where: { status: BookingStatus.AWAITING_PAYMENT } },
  { key: "completed", label: "Completed", where: { status: BookingStatus.COMPLETED } },
  { key: "cancelled", label: "Cancelled", where: { status: BookingStatus.CANCELLED } },
];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const active = FILTERS.find((f) => f.key === searchParams.filter) ?? FILTERS[0];

  const bookings = await prisma.booking.findMany({
    where: active.where,
    orderBy: { startTime: "desc" },
    take: 100,
    include: { artist: true, appointmentType: true, customer: true, payments: true },
  });

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Every appointment, filterable by status." />

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/bookings?filter=${f.key}`}
            className={clsx(
              "rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors",
              active.key === f.key
                ? "border-vermilion bg-vermilion text-ink"
                : "border-ink-line text-bone-muted hover:border-bone-muted hover:text-bone"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings here"
          hint="Try a different filter, or wait for new bookings to arrive"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-line">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-ink-line bg-ink-soft text-left font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                  <th className="px-4 py-3 font-normal">When</th>
                  <th className="px-4 py-3 font-normal">Customer</th>
                  <th className="px-4 py-3 font-normal">Service · Artist</th>
                  <th className="px-4 py-3 font-normal">Amount</th>
                  <th className="px-4 py-3 font-normal">Payment</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line">
                {bookings.map((b) => (
                  <tr key={b.id} className="group transition-colors hover:bg-bone/[0.03]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="block">
                        <div className="text-bone">{formatDate(b.startTime)}</div>
                        <div className="font-mono text-[11px] text-bone-muted">
                          {formatTime(b.startTime)}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="block">
                        <div className="text-bone">{b.customer.name}</div>
                        <div className="font-mono text-[11px] text-bone-muted">
                          {b.reference}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-bone-muted">
                      <div className="text-bone">{b.appointmentType.name}</div>
                      <div className="font-mono text-[11px]">{b.artist.name}</div>
                    </td>
                    <td className="px-4 py-3 text-bone">
                      {formatMoney(b.amountDueCents, b.currency)}
                    </td>
                    <td className="px-4 py-3">
                      {b.payments[0] ? (
                        <StatusBadge status={b.payments[0].status} kind="payment" />
                      ) : (
                        <span className="text-bone-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

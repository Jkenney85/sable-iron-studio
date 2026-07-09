import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/admin/ui";
import { BookingStatusActions } from "@/components/admin/BookingStatusActions";
import { formatMoney, formatDateTime, formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      artist: true,
      appointmentType: true,
      customer: true,
      payments: { orderBy: { createdAt: "desc" } },
      intake: { include: { references: true } },
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) notFound();

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/bookings"
        className="font-mono text-[11px] uppercase tracking-widest text-bone-muted hover:text-bone"
      >
        ← All bookings
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl md:text-4xl">{booking.customer.name}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <div className="mt-1 font-mono text-sm text-bone-muted">
            {booking.reference} · {booking.appointmentType.name}
          </div>
        </div>
      </div>

      {/* Status actions */}
      <div className="mt-6 card p-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          Update status
        </div>
        <BookingStatusActions bookingId={booking.id} current={booking.status} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Appointment */}
        <Section title="Appointment">
          <Row label="Service" value={booking.appointmentType.name} />
          <Row label="Artist" value={booking.artist.name} />
          <Row label="When" value={formatDateTime(booking.startTime)} />
          <Row
            label="Duration"
            value={formatDuration(booking.appointmentType.durationMinutes)}
          />
        </Section>

        {/* Customer */}
        <Section title="Customer">
          <Row label="Name" value={booking.customer.name} />
          <Row
            label="Email"
            value={
              <a href={`mailto:${booking.customer.email}`} className="hover:text-vermilion">
                {booking.customer.email}
              </a>
            }
          />
          {booking.customer.phone && (
            <Row
              label="Phone"
              value={
                <a href={`tel:${booking.customer.phone}`} className="hover:text-vermilion">
                  {booking.customer.phone}
                </a>
              }
            />
          )}
        </Section>

        {/* Payment */}
        <Section title="Payment">
          <Row
            label="Choice"
            value={booking.paymentChoice === "DEPOSIT" ? "Deposit" : "Full payment"}
          />
          <Row label="Amount" value={formatMoney(booking.amountDueCents, booking.currency)} />
          {booking.payments.map((p) => (
            <div key={p.id} className="mt-3 rounded-lg border border-ink-line bg-ink p-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={p.status} kind="payment" />
                <span className="text-sm text-bone">{formatMoney(p.amountCents, p.currency)}</span>
              </div>
              {p.stripePaymentIntentId && (
                <div className="mt-2 break-all font-mono text-[10px] text-bone-muted">
                  PI: {p.stripePaymentIntentId}
                </div>
              )}
              {p.receiptUrl && (
                <a
                  href={p.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block font-mono text-[11px] text-vermilion-soft hover:underline"
                >
                  Stripe receipt ↗
                </a>
              )}
            </div>
          ))}
        </Section>

        {/* Google Calendar sync (future) */}
        <Section title="Calendar sync">
          <Row label="Status" value={booking.gcalSyncStatus ?? "disabled"} />
          <Row label="Event ID" value={booking.gcalEventId ?? "—"} />
          <p className="mt-2 text-[11px] leading-relaxed text-bone-muted">
            Per-artist Google Calendar sync is scaffolded in the data model and can
            be enabled later without a migration.
          </p>
        </Section>
      </div>

      {/* Intake */}
      {booking.intake && (
        <Section title="Tattoo intake" className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Placement" value={booking.intake.placement || "—"} />
            <Row label="Approx. size" value={booking.intake.approxSize || "—"} />
            <Row label="Style" value={booking.intake.style || "—"} />
            <Row label="Budget" value={booking.intake.budget || "—"} />
            <Row label="Color" value={booking.intake.isColor ? "Yes" : "—"} />
            <Row label="Cover-up" value={booking.intake.isCoverUp ? "Yes" : "—"} />
          </div>
          {booking.intake.notes && (
            <div className="mt-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                Notes
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-bone-soft">
                {booking.intake.notes}
              </p>
            </div>
          )}
          {booking.intake.references.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                Reference images ({booking.intake.references.length})
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {booking.intake.references.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-square overflow-hidden rounded-lg border border-ink-line bg-ink-raised"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={r.fileName} className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Notifications */}
      {booking.notifications.length > 0 && (
        <Section title="Notifications" className="mt-6">
          <ul className="space-y-2">
            {booking.notifications.map((n) => (
              <li
                key={n.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm"
              >
                <span className="text-bone-muted">
                  {n.kind.replace(/_/g, " ").toLowerCase()} → {n.to}
                </span>
                <span
                  className={
                    n.status === "SENT"
                      ? "font-mono text-[10px] uppercase tracking-widest text-emerald-400"
                      : n.status === "FAILED"
                        ? "font-mono text-[10px] uppercase tracking-widest text-red-400"
                        : "font-mono text-[10px] uppercase tracking-widest text-amber-400"
                  }
                >
                  {n.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-5 ${className ?? ""}`}>
      <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-vermilion">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        {label}
      </span>
      <span className="text-right text-bone">{value}</span>
    </div>
  );
}

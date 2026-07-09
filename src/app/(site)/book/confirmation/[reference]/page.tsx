import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fulfillCheckoutSession } from "@/lib/fulfillment";
import { isStripeConfigured } from "@/lib/stripe";
import { formatDate, formatTime, formatDuration, formatMoney } from "@/lib/format";
import { BookingStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Booking confirmation",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: { reference: string };
  searchParams: { session_id?: string; canceled?: string; demo?: string };
}) {
  // If we arrived from a Stripe success redirect, reconcile the payment now so
  // the page is accurate even if the webhook hasn't landed yet.
  if (searchParams.session_id && isStripeConfigured()) {
    await fulfillCheckoutSession(searchParams.session_id).catch(() => {});
  }

  const booking = await prisma.booking.findUnique({
    where: { reference: params.reference },
    include: {
      artist: true,
      appointmentType: true,
      customer: true,
      payments: true,
      intake: { include: { references: true } },
    },
  });
  if (!booking) notFound();

  const canceled = Boolean(searchParams.canceled);
  const confirmed = booking.status === BookingStatus.CONFIRMED;
  const payment = booking.payments[0];

  return (
    <div className="container-editorial max-w-3xl py-16 md:py-24">
      {/* Status banner */}
      {confirmed ? (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-vermilion text-2xl text-vermilion">
            ✓
          </div>
          <p className="kicker mt-6">Booking confirmed</p>
          <h1 className="mt-4 text-balance font-display text-4xl md:text-6xl">
            You&apos;re on the books.
          </h1>
          <p className="mt-5 text-lg text-bone-muted">
            A confirmation{payment ? " and receipt" : ""} is on its way to{" "}
            <span className="text-bone">{booking.customer.email}</span>.
          </p>
        </div>
      ) : canceled ? (
        <div className="text-center">
          <p className="kicker">Payment not completed</p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl">Almost there.</h1>
          <p className="mt-5 text-lg text-bone-muted">
            Your checkout was canceled, so this time isn&apos;t held yet. You can
            try again below.
          </p>
          <Link href="/book" className="btn-primary mt-8">
            Return to booking
          </Link>
        </div>
      ) : (
        <div className="text-center">
          <p className="kicker">Awaiting payment</p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl">Nearly done.</h1>
          <p className="mt-5 text-lg text-bone-muted">
            We&apos;re waiting on payment confirmation. This page updates
            automatically once it clears — refresh in a moment.
          </p>
        </div>
      )}

      {/* Details card */}
      <div className="card mt-12 overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-line bg-ink-raised px-6 py-4">
          <span className="kicker">Appointment</span>
          <span className="font-mono text-sm text-bone">{booking.reference}</span>
        </div>
        <dl className="divide-y divide-ink-line">
          {[
            ["Service", booking.appointmentType.name],
            ["Artist", booking.artist.name],
            ["Date", formatDate(booking.startTime)],
            ["Time", formatTime(booking.startTime)],
            ["Duration", formatDuration(booking.appointmentType.durationMinutes)],
            [
              booking.paymentChoice === "DEPOSIT" ? "Deposit paid" : "Paid",
              `${formatMoney(booking.amountDueCents, booking.currency)}${
                payment ? ` · ${payment.status.toLowerCase()}` : ""
              }`,
            ],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-6 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
                {label}
              </dt>
              <dd className="text-right text-bone">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {confirmed && (
        <>
          {booking.paymentChoice === "DEPOSIT" &&
            booking.appointmentType.priceCents > 0 && (
              <p className="mt-6 text-center text-sm text-bone-muted">
                Remaining balance of{" "}
                {formatMoney(
                  booking.appointmentType.priceCents - booking.amountDueCents,
                  booking.currency
                )}{" "}
                is due at your session.
              </p>
            )}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/" className="btn-outline">
              Back to home
            </Link>
            <Link href="/gallery" className="btn-ghost">
              Browse the gallery
            </Link>
          </div>
          <p className="mt-10 text-center text-xs text-bone-muted">
            Need to change or cancel? Reply to your confirmation email or contact
            the studio — please give at least 48 hours&apos; notice.
          </p>
        </>
      )}
    </div>
  );
}

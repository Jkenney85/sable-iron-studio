import "server-only";
import type Stripe from "stripe";
import { getStripe } from "./stripe";
import { prisma } from "./prisma";
import {
  sendBookingConfirmation,
  sendPaymentReceipt,
  sendStudioNewBooking,
} from "./email";
import { BookingStatus, PaymentStatus } from "@prisma/client";

// Single source of truth for turning a paid Stripe Checkout session into a
// confirmed booking. Called by BOTH the webhook and the success page, so the
// booking is finalized reliably regardless of which arrives first. Idempotent:
// once the payment is PAID, subsequent calls are no-ops (no duplicate emails).

export type FulfillResult = "confirmed" | "already" | "unpaid" | "not_found";

export async function fulfillCheckoutSession(
  sessionId: string
): Promise<FulfillResult> {
  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: {
      booking: {
        include: { artist: true, appointmentType: true, customer: true },
      },
    },
  });
  if (!payment || !payment.booking) return "not_found";
  if (payment.status === PaymentStatus.PAID) return "already";

  // Confirm with Stripe that the session is actually paid.
  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "payment_intent.latest_charge"],
    });
  } catch {
    return "not_found";
  }
  if (session.payment_status !== "paid") return "unpaid";

  const pi = session.payment_intent as Stripe.PaymentIntent | null;
  const charge = (pi?.latest_charge as Stripe.Charge | null) ?? null;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        stripePaymentIntentId: typeof pi === "string" ? pi : pi?.id ?? null,
        stripeChargeId: charge?.id ?? null,
        receiptUrl: charge?.receipt_url ?? null,
      },
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CONFIRMED },
    }),
  ]);

  const booking = payment.booking;
  await Promise.allSettled([
    sendBookingConfirmation(booking),
    sendPaymentReceipt(booking, payment.amountCents, payment.kind, charge?.receipt_url ?? null),
    sendStudioNewBooking(booking),
  ]);

  return "confirmed";
}

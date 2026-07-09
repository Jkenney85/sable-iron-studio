import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { fulfillCheckoutSession } from "@/lib/fulfillment";
import { BookingStatus, PaymentStatus } from "@prisma/client";

// Stripe webhook. This is the authoritative place where payment + booking status
// are updated. Configure the endpoint URL as {APP_URL}/api/stripe/webhook and put
// the signing secret in STRIPE_WEBHOOK_SECRET.
//
// Local testing:  stripe listen --forward-to localhost:3000/api/stripe/webhook

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig || !env.stripe.webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, env.stripe.webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "checkout.session.expired": {
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "charge.refunded": {
        await handleRefund(event.data.object as Stripe.Charge);
        break;
      }
      default:
        // Ignore unhandled event types.
        break;
    }
  } catch (err) {
    console.error(`[webhook] handler error for ${event.type}`, err);
    // Return 500 so Stripe retries.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  // Delegate to the shared, idempotent fulfillment routine.
  await fulfillCheckoutSession(session.id);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (!payment || payment.status === PaymentStatus.PAID) return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CANCELLED },
    }),
  ]);
}

async function handleRefund(charge: Stripe.Charge) {
  if (!charge.payment_intent) return;
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent.id;

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: piId },
  });
  if (!payment) return;

  const fullyRefunded = charge.amount_refunded >= charge.amount;
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: fullyRefunded
        ? PaymentStatus.REFUNDED
        : PaymentStatus.PARTIALLY_REFUNDED,
    },
  });
  if (fullyRefunded) {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }
}

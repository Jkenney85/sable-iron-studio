import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validation";
import { resolveAmountCents } from "@/lib/pricing";
import { getAvailableSlots, isSlotFree } from "@/lib/availability";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { env } from "@/lib/env";
import { makeReference } from "@/lib/format";
import {
  sendBookingConfirmation,
  sendPaymentReceipt,
  sendStudioNewBooking,
} from "@/lib/email";
import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";

// POST /api/booking
// Creates a booking (double-booking safe) and either:
//   • opens a Stripe Checkout session and returns { checkoutUrl }, or
//   • (when Stripe keys are absent — demo mode) confirms immediately and
//     returns { confirmationUrl } so the flow is fully testable offline.

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createBookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your details." },
      { status: 422 }
    );
  }
  const input = parsed.data;

  // Load appointment type + confirm the artist offers it and is bookable.
  const type = await prisma.appointmentType.findUnique({
    where: { id: input.appointmentTypeId },
    include: { artists: { where: { artistId: input.artistId } } },
  });
  if (!type || !type.active) {
    return NextResponse.json({ error: "That appointment type is unavailable." }, { status: 404 });
  }
  const artist = await prisma.artist.findUnique({ where: { id: input.artistId } });
  if (!artist || !artist.active || !artist.bookingOpen || type.artists.length === 0) {
    return NextResponse.json(
      { error: "That artist isn't taking this booking right now." },
      { status: 409 }
    );
  }

  const start = new Date(input.startTime);
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) {
    return NextResponse.json({ error: "Please choose a future time." }, { status: 422 });
  }
  const end = new Date(start.getTime() + type.durationMinutes * 60_000);

  // Confirm the chosen start is genuinely an open slot (within working hours,
  // not on time-off, not taken). Authoritative conflict re-check happens in the tx.
  const dateStr = start.toISOString().slice(0, 10);
  const slots = await getAvailableSlots({
    artistId: artist.id,
    dateStr,
    durationMinutes: type.durationMinutes,
  });
  const match = slots.find((s) => new Date(s.start).getTime() === start.getTime());
  if (!match || !match.available) {
    return NextResponse.json(
      { error: "That time was just taken. Please pick another slot." },
      { status: 409 }
    );
  }

  // Pricing.
  const amount = resolveAmountCents(type, input.paymentChoice);
  if (!amount.ok) {
    return NextResponse.json({ error: amount.reason }, { status: 422 });
  }
  const currency = env.stripe.currency || "usd";

  // ── Create booking inside a transaction (guards against double-booking) ──────
  let bookingId: string;
  let reference: string;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const free = await isSlotFree(tx as never, artist.id, start, end);
      if (!free) throw new Error("SLOT_TAKEN");

      const customer = await tx.customer.create({
        data: {
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone || null,
        },
      });

      const ref = makeReference();
      const booking = await tx.booking.create({
        data: {
          reference: ref,
          artistId: artist.id,
          appointmentTypeId: type.id,
          customerId: customer.id,
          startTime: start,
          endTime: end,
          status: BookingStatus.PENDING,
          paymentChoice: input.paymentChoice,
          amountDueCents: amount.amountCents,
          currency,
          gcalSyncStatus: "disabled",
          intake:
            input.intake && type.requiresIntake
              ? {
                  create: {
                    placement: input.intake.placement || null,
                    approxSize: input.intake.approxSize || null,
                    style: input.intake.style || null,
                    budget: input.intake.budget || null,
                    notes: input.intake.notes || null,
                    isColor: input.intake.isColor ?? null,
                    isCoverUp: input.intake.isCoverUp ?? null,
                    references: input.intake.referenceImages?.length
                      ? {
                          create: input.intake.referenceImages.map((r) => ({
                            url: r.url,
                            fileName: r.fileName,
                            mimeType: r.mimeType,
                            sizeBytes: r.sizeBytes,
                          })),
                        }
                      : undefined,
                  },
                }
              : undefined,
          payments: {
            create: {
              kind: input.paymentChoice,
              status: PaymentStatus.PENDING,
              amountCents: amount.amountCents,
              currency,
            },
          },
        },
      });
      return { bookingId: booking.id, reference: ref };
    });
    bookingId = result.bookingId;
    reference = result.reference;
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "That time was just taken. Please pick another slot." },
        { status: 409 }
      );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // reference collision — extremely rare; ask client to retry.
      return NextResponse.json({ error: "Please try again." }, { status: 409 });
    }
    console.error("[booking] create failed", err);
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }

  const full = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { artist: true, appointmentType: true, customer: true, payments: true },
  });

  // ── Payment ─────────────────────────────────────────────────────────────────
  if (isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: full.customer.email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amount.amountCents,
              product_data: {
                name: `${type.name} — ${artist.name}`,
                description:
                  input.paymentChoice === "DEPOSIT"
                    ? "Booking deposit (applied to your final price)"
                    : "Full appointment payment",
              },
            },
          },
        ],
        metadata: {
          bookingId: full.id,
          reference: full.reference,
          paymentId: full.payments[0]?.id ?? "",
          paymentChoice: input.paymentChoice,
        },
        success_url: `${env.appUrl}/book/confirmation/${reference}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.appUrl}/book/confirmation/${reference}?canceled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
      });

      await prisma.$transaction([
        prisma.booking.update({
          where: { id: full.id },
          data: { status: BookingStatus.AWAITING_PAYMENT },
        }),
        prisma.payment.update({
          where: { id: full.payments[0].id },
          data: { stripeCheckoutSessionId: session.id },
        }),
      ]);

      return NextResponse.json({ checkoutUrl: session.url, reference });
    } catch (err) {
      console.error("[booking] stripe checkout failed", err);
      // Roll the booking back to PENDING so the slot can be retried.
      await prisma.booking.update({
        where: { id: full.id },
        data: { status: BookingStatus.PENDING },
      });
      return NextResponse.json(
        { error: "Payment could not be started. Please try again." },
        { status: 502 }
      );
    }
  }

  // ── Demo mode (no Stripe keys): confirm immediately so the flow works offline ─
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: full.id },
      data: { status: BookingStatus.CONFIRMED },
    }),
    prisma.payment.update({
      where: { id: full.payments[0].id },
      data: { status: PaymentStatus.PAID },
    }),
  ]);

  const confirmed = await prisma.booking.findUniqueOrThrow({
    where: { id: full.id },
    include: { artist: true, appointmentType: true, customer: true },
  });
  // Fire-and-forget notifications.
  Promise.allSettled([
    sendBookingConfirmation(confirmed),
    sendPaymentReceipt(confirmed, amount.amountCents, input.paymentChoice, null),
    sendStudioNewBooking(confirmed),
  ]).catch(() => {});

  return NextResponse.json({
    confirmationUrl: `/book/confirmation/${reference}?demo=1`,
    reference,
  });
}

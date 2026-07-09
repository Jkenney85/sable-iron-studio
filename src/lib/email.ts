import "server-only";
import nodemailer from "nodemailer";
import type { Booking, Artist, AppointmentType, Customer } from "@prisma/client";
import { env, isEmailConfigured } from "./env";
import { prisma } from "./prisma";
import { formatDateTime, formatMoney } from "./format";
import {
  NotificationKind,
  NotificationStatus,
  NotificationChannel,
} from "@prisma/client";

// Email notification scaffolding.
//
// Every send is logged as a NotificationEvent row (PENDING -> SENT/FAILED) so the
// admin has an audit trail. When SMTP is not configured, emails are logged to the
// console instead of failing — safe for local dev and CI. SMS is intentionally
// left as a future channel (see NotificationChannel.SMS).

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.password }
        : undefined,
    });
  }
  return transporter;
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  kind: NotificationKind;
  bookingId?: string;
};

async function send({ to, subject, html, text, kind, bookingId }: SendArgs) {
  const event = await prisma.notificationEvent.create({
    data: {
      to,
      subject,
      kind,
      bookingId,
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.PENDING,
    },
  });

  try {
    const tx = getTransporter();
    if (!tx) {
      // No SMTP configured — log so devs can see the payload.
      console.info(
        `\n[email:dev] ${kind} → ${to}\n  subject: ${subject}\n  ${text.replace(/\n/g, "\n  ")}\n`
      );
    } else {
      await tx.sendMail({ from: env.smtp.from, to, subject, html, text });
    }
    await prisma.notificationEvent.update({
      where: { id: event.id },
      data: { status: NotificationStatus.SENT, sentAt: new Date() },
    });
  } catch (err) {
    await prisma.notificationEvent.update({
      where: { id: event.id },
      data: {
        status: NotificationStatus.FAILED,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    console.error(`[email] failed to send ${kind} to ${to}`, err);
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#0b0b0d;padding:32px 0;font-family:Georgia,'Times New Roman',serif;color:#f3efe6">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141417;border:1px solid #2a2a30;border-radius:14px;overflow:hidden">
    <tr><td style="padding:28px 32px;border-bottom:1px solid #2a2a30">
      <div style="letter-spacing:.3em;font-size:11px;color:#e2472a;font-family:Arial,sans-serif;text-transform:uppercase">Sable &amp; Iron</div>
      <div style="font-size:24px;margin-top:8px">${title}</div>
    </td></tr>
    <tr><td style="padding:28px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#d8d3c6">${body}</td></tr>
    <tr><td style="padding:20px 32px;border-top:1px solid #2a2a30;font-family:Arial,sans-serif;font-size:12px;color:#9a9488">
      Sable &amp; Iron Tattoo · This is a transactional message about your appointment.
    </td></tr>
  </table></td></tr></table></body></html>`;
}

type FullBooking = Booking & {
  artist: Artist;
  appointmentType: AppointmentType;
  customer: Customer;
};

function detailsBlock(b: FullBooking) {
  return `
    <p><strong>Reference:</strong> ${b.reference}<br/>
    <strong>Service:</strong> ${b.appointmentType.name}<br/>
    <strong>Artist:</strong> ${b.artist.name}<br/>
    <strong>When:</strong> ${formatDateTime(b.startTime)}</p>`;
}

export async function sendBookingConfirmation(b: FullBooking) {
  const body = `
    <p>Hi ${b.customer.name.split(" ")[0]},</p>
    <p>Your appointment request is in. Here are the details:</p>
    ${detailsBlock(b)}
    <p>We'll be in touch if we need anything else before your session. Reply to this email with questions.</p>`;
  await send({
    to: b.customer.email,
    subject: `Booking confirmed · ${b.reference}`,
    html: shell("Your appointment is booked", body),
    text: `Your appointment is booked.\nReference: ${b.reference}\nService: ${b.appointmentType.name}\nArtist: ${b.artist.name}\nWhen: ${formatDateTime(b.startTime)}`,
    kind: NotificationKind.BOOKING_CONFIRMATION,
    bookingId: b.id,
  });
}

export async function sendPaymentReceipt(
  b: FullBooking,
  amountCents: number,
  kind: "DEPOSIT" | "FULL",
  receiptUrl?: string | null
) {
  const label = kind === "DEPOSIT" ? "Deposit" : "Payment";
  const body = `
    <p>Hi ${b.customer.name.split(" ")[0]},</p>
    <p>We received your ${label.toLowerCase()} of <strong>${formatMoney(amountCents, b.currency)}</strong>.</p>
    ${detailsBlock(b)}
    ${receiptUrl ? `<p><a href="${receiptUrl}" style="color:#ef6a50">View your Stripe receipt →</a></p>` : ""}`;
  await send({
    to: b.customer.email,
    subject: `${label} received · ${b.reference}`,
    html: shell(`${label} received`, body),
    text: `We received your ${label.toLowerCase()} of ${formatMoney(amountCents, b.currency)} for ${b.reference}.`,
    kind: NotificationKind.PAYMENT_RECEIPT,
    bookingId: b.id,
  });
}

export async function sendStudioNewBooking(b: FullBooking) {
  const body = `
    <p>New booking via the website.</p>
    ${detailsBlock(b)}
    <p><strong>Customer:</strong> ${b.customer.name} · ${b.customer.email}${b.customer.phone ? ` · ${b.customer.phone}` : ""}</p>`;
  await send({
    to: env.smtp.studioInbox,
    subject: `New booking · ${b.appointmentType.name} · ${b.reference}`,
    html: shell("New booking", body),
    text: `New booking ${b.reference}: ${b.appointmentType.name} with ${b.artist.name} for ${b.customer.name} at ${formatDateTime(b.startTime)}.`,
    kind: NotificationKind.STUDIO_NEW_BOOKING,
    bookingId: b.id,
  });
}

// Reminder scaffolding — wire to a cron/queue later (see TODOs).
export async function sendAppointmentReminder(b: FullBooking) {
  const body = `
    <p>Hi ${b.customer.name.split(" ")[0]},</p>
    <p>A reminder of your upcoming appointment:</p>
    ${detailsBlock(b)}
    <p>Please arrive 10 minutes early and bring a valid ID.</p>`;
  await send({
    to: b.customer.email,
    subject: `Reminder · your appointment ${b.reference}`,
    html: shell("Appointment reminder", body),
    text: `Reminder: ${b.appointmentType.name} with ${b.artist.name} on ${formatDateTime(b.startTime)} (${b.reference}).`,
    kind: NotificationKind.APPOINTMENT_REMINDER,
    bookingId: b.id,
  });
}

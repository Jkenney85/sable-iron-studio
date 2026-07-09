import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { contactSchema } from "@/lib/validation";
import { env, isEmailConfigured } from "@/lib/env";

// Public contact form endpoint. Sends the message to the studio inbox (or logs
// it in dev when SMTP is not configured).
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 422 }
    );
  }

  const { name, email, message } = parsed.data;
  const subject = `Website enquiry from ${name}`;
  const text = `From: ${name} <${email}>\n\n${message}`;

  try {
    if (isEmailConfigured()) {
      const tx = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,
        auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
      });
      await tx.sendMail({
        from: env.smtp.from,
        to: env.smtp.studioInbox,
        replyTo: email,
        subject,
        text,
      });
    } else {
      console.info(`\n[contact:dev] ${subject}\n${text}\n`);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] send failed", err);
    return NextResponse.json(
      { error: "Could not send right now. Please email us directly." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";

// POST /api/admin/auth/login  { email, password }
// Note: this path is allowed through middleware so staff can authenticate.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 422 });
  }

  const { email, password } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });

  // Constant-ish response: same error whether the email or password is wrong.
  const ok = admin ? await verifyPassword(password, admin.passwordHash) : false;
  if (!admin || !ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await signSession({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
  setSessionCookie(token);

  return NextResponse.json({ ok: true });
}

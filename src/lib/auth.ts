import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";

// Admin session is a signed JWT stored in an httpOnly cookie. Middleware verifies
// the signature on every /admin request; server components/handlers can decode
// the full session payload here.

export const SESSION_COOKIE = "si_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export type SessionPayload = {
  sub: string; // admin id
  email: string;
  name: string;
  role: string;
};

function secretKey() {
  if (!env.authSecret || env.authSecret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a long random value (openssl rand -hex 32)."
    );
  }
  return new TextEncoder().encode(env.authSecret);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

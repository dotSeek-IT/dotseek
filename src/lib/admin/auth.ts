import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal admin authentication for the enquiry inbox.
 * Env: ADMIN_PASSWORD (required to enable /admin) and ADMIN_SECRET (signs the
 * session cookie; falls back to ADMIN_PASSWORD). Sessions last 12 hours and
 * are httpOnly, secure (in production) and SameSite=Lax.
 */

const COOKIE = "ds_admin";
const MAX_AGE = 60 * 60 * 12;

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

const secret = () => process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? "";

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare HMACs so the comparison is constant-time regardless of length.
  return safeEqual(sign(`pw:${password}`), sign(`pw:${expected}`));
}

export async function createSession() {
  const expires = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || !safeEqual(signature, sign(expires))) return false;
  return Number(expires) > Date.now();
}

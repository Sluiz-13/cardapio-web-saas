import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 dias

function getSecret(): string {
  const base = process.env.NEXTAUTH_SECRET;
  if (!base) throw new Error("NEXTAUTH_SECRET não configurado.");
  // Prefixo pra garantir que esse token nunca seja confundido com o do admin,
  // mesmo reaproveitando a mesma variável de ambiente como segredo.
  return `customer-session:${base}`;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export type CustomerSessionData = { customerId: string; restaurantId: string; exp: number };

export function createCustomerSessionToken(customerId: string, restaurantId: string): string {
  const data: CustomerSessionData = {
    customerId,
    restaurantId,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyCustomerSessionToken(token: string | undefined): CustomerSessionData | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data: CustomerSessionData = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSessionData | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifyCustomerSessionToken(token);
}

export function customerSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export const CUSTOMER_COOKIE_NAME = COOKIE_NAME;
import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME } from "@/lib/customer-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: CUSTOMER_COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return res;
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-session";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ customer: null });

  const customer = await db.customer.findUnique({
    where: { id: session.customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      loyaltyPoints: true,
      cashbackBalanceCents: true,
      restaurantId: true,
      street: true,
      number: true,
      complement: true,
      neighborhood: true,
      city: true,
      referenceNote: true,
    },
  });
  if (!customer || customer.restaurantId !== session.restaurantId) {
    return NextResponse.json({ customer: null });
  }
  return NextResponse.json({ customer });
}
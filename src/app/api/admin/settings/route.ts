import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const updateSchema = z.object({
  isOpen: z.boolean().optional(),
  defaultDeliveryFeeCents: z.number().int().nonnegative().optional(),
  serviceFeePercent: z.number().int().min(0).max(100).optional(),
  printKitchenCopy: z.boolean().optional(),
  pixKey: z.string().optional(),
  pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]).optional(),
  pixMerchantName: z.string().max(25).optional(),
  pixMerchantCity: z.string().max(15).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(150).optional(),
  avgDeliveryTime: z.string().max(30).optional(),
  printMethod: z.enum(["MANUAL", "RAWBT", "AGENT", "AGENT_BLUETOOTH", "QZ_TRAY"]).optional(),
  printerIp: z.string().max(45).optional(),
  printerPort: z.number().int().min(1).max(65535).optional(),
  printerBluetoothAddress: z.string().max(30).optional(),
  printerBluetoothName: z.string().max(100).optional(),
  printerQzName: z.string().max(150).optional(),
  businessHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        isOpen: z.boolean(),
        openTime: z.string().regex(timeRegex, "Horário inválido, use HH:mm"),
        closeTime: z.string().regex(timeRegex, "Horário inválido, use HH:mm"),
      })
    )
    .optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: {
    id: true,
    name: true, 
    isOpen: true, 
    defaultDeliveryFeeCents: true,
    serviceFeePercent: true,
    printKitchenCopy: true,
    pixKey: true, 
    pixKeyType: true, 
    pixMerchantName: true, 
    pixMerchantCity: true,
    phone: true, 
    address: true, 
    avgDeliveryTime: true,
    printMethod: true,
    printerIp: true,
    printerPort: true,
    printerBluetoothAddress: true,
    printerBluetoothName: true,
    printerQzName: true,
  },
  });

  const businessHours = await db.businessHours.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ restaurant, businessHours });
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const {
    isOpen,
    defaultDeliveryFeeCents,
    serviceFeePercent,
    printKitchenCopy,
    pixKey,
    pixKeyType,
    pixMerchantName,
    pixMerchantCity,
    phone,
    address,
    avgDeliveryTime,
    printMethod,
    printerIp,
    printerPort,
    printerBluetoothAddress,
    printerBluetoothName,
    printerQzName,
    businessHours,
  } = parsed.data;

  const restaurantData: Record<string, unknown> = {};
  if (isOpen !== undefined) restaurantData.isOpen = isOpen;
  if (defaultDeliveryFeeCents !== undefined) restaurantData.defaultDeliveryFeeCents = defaultDeliveryFeeCents;
  if (serviceFeePercent !== undefined) restaurantData.serviceFeePercent = serviceFeePercent;
  if (printKitchenCopy !== undefined) restaurantData.printKitchenCopy = printKitchenCopy;
  if (pixKey !== undefined) restaurantData.pixKey = pixKey;
  if (pixKeyType !== undefined) restaurantData.pixKeyType = pixKeyType;
  if (pixMerchantName !== undefined) restaurantData.pixMerchantName = pixMerchantName;
  if (pixMerchantCity !== undefined) restaurantData.pixMerchantCity = pixMerchantCity;
  if (phone !== undefined) restaurantData.phone = phone;
  if (address !== undefined) restaurantData.address = address;
  if (avgDeliveryTime !== undefined) restaurantData.avgDeliveryTime = avgDeliveryTime;
  if (printMethod !== undefined) restaurantData.printMethod = printMethod;
  if (printerIp !== undefined) restaurantData.printerIp = printerIp;
  if (printerPort !== undefined) restaurantData.printerPort = printerPort;
  if (printerBluetoothAddress !== undefined) restaurantData.printerBluetoothAddress = printerBluetoothAddress;
  if (printerBluetoothName !== undefined) restaurantData.printerBluetoothName = printerBluetoothName;
  if (printerQzName !== undefined) restaurantData.printerQzName = printerQzName;

  if (Object.keys(restaurantData).length > 0) {
    await db.restaurant.update({ where: { id: session.user.restaurantId }, data: restaurantData });
  }

  if (businessHours) {
    await db.$transaction(
      businessHours.map((h) =>
        db.businessHours.upsert({
          where: { restaurantId_dayOfWeek: { restaurantId: session.user.restaurantId, dayOfWeek: h.dayOfWeek } },
          update: { isOpen: h.isOpen, openTime: h.openTime, closeTime: h.closeTime },
          create: { ...h, restaurantId: session.user.restaurantId },
        })
      )
    );
  }

  return NextResponse.json({ ok: true });
}
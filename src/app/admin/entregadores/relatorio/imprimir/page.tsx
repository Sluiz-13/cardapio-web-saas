import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import PrintTrigger from "./_print-trigger";

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default async function PrintDriverReportPage({ searchParams }: { searchParams: { date?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  const dateParam = searchParams.date;
  const date = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

  const orders = await db.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      deliveryType: "DELIVERY",
      status: "DELIVERED",
      driverId: { not: null },
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    select: {
      id: true,
      street: true,
      number: true,
      neighborhood: true,
      deliveryFeeCents: true,
      createdAt: true,
      driver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const byDriver = new Map<string, { driverName: string; deliveries: typeof orders; totalCents: number }>();
  for (const order of orders) {
    if (!order.driver) continue;
    const key = order.driver.id;
    if (!byDriver.has(key)) byDriver.set(key, { driverName: order.driver.name, deliveries: [], totalCents: 0 });
    const entry = byDriver.get(key)!;
    entry.deliveries.push(order);
    entry.totalCents += order.deliveryFeeCents;
  }
  const report = Array.from(byDriver.values());
  const dateLabel = date.toLocaleDateString("pt-BR");

  return (
    <div className="max-w-[600px] mx-auto p-6 font-mono text-[12px] leading-snug text-black bg-white">
      <PrintTrigger />

      <div className="text-center mb-4">
        <p className="font-bold uppercase text-sm">Relatório de Entregadores</p>
        <p>{dateLabel}</p>
      </div>

      <hr className="border-dashed border-black my-3" />

      {report.length === 0 && <p className="text-center text-gray-500">Nenhuma entrega concluída nesse dia.</p>}

      {report.map((entry) => (
        <div key={entry.driverName} className="mb-4">
          <p className="font-bold">{entry.driverName}</p>
          <div className="pl-2">
            {entry.deliveries.map((d) => (
              <div key={d.id} className="flex justify-between">
                <span>
                  {d.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — {d.street}, {d.number}
                  {d.neighborhood ? ` (${d.neighborhood})` : ""}
                </span>
                <span>{currency(d.deliveryFeeCents)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold pt-1 border-t border-dashed border-black mt-1">
            <span>Total ({entry.deliveries.length} entregas)</span>
            <span>{currency(entry.totalCents)}</span>
          </div>
        </div>
      ))}

      <hr className="border-dashed border-black my-3" />
      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL GERAL</span>
        <span>{currency(report.reduce((s, e) => s + e.totalCents, 0))}</span>
      </div>
    </div>
  );
}
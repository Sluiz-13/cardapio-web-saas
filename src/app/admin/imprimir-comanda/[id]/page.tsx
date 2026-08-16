import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import PrintTrigger from "../../pedidos/[id]/imprimir/_print-trigger";

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default async function PrintComandaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  const comanda = await db.comanda.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    include: {
      table: { select: { label: true } },
      restaurant: { select: { name: true } },
      orders: {
        select: { customerName: true, totalCents: true, items: { select: { productName: true, qty: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!comanda) notFound();

  const total = comanda.orders.reduce((s, o) => s + o.totalCents, 0);

  return (
    <div className="max-w-[300px] mx-auto p-4 font-mono text-[12px] leading-snug text-black bg-white">
      <PrintTrigger />

      <div className="text-center mb-3">
        <p className="font-bold uppercase text-sm">{comanda.restaurant.name}</p>
        <p>CONTA — {comanda.table.label}</p>
        <p>{new Date().toLocaleString("pt-BR")}</p>
      </div>

      <hr className="border-dashed border-black my-2" />

      {comanda.orders.map((order, i) => (
        <div key={i} className="mb-2">
          <p className="font-bold">{order.customerName}</p>
          {order.items.map((item, j) => (
            <p key={j} className="pl-2">{item.qty}x {item.productName}</p>
          ))}
          <div className="flex justify-between">
            <span />
            <span>{currency(order.totalCents)}</span>
          </div>
        </div>
      ))}

      <hr className="border-dashed border-black my-2" />

      <div className="flex justify-between font-bold">
        <span>TOTAL DA CONTA</span>
        <span>{currency(total)}</span>
      </div>
    </div>
  );
}
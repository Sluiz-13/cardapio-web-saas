import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import PrintTrigger from "./_print-trigger";

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default async function PrintOrderPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  // Escopado por restaurantId mesmo aqui — evita que um admin monte a URL
  // na mão e imprima pedido de outro restaurante só adivinhando o id.
  const order = await db.order.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    include: { items: true, restaurant: true, table: { select: { label: true } } },
  });
  if (!order) notFound();

  return (
    <>
    <div className="max-w-[300px] mx-auto p-4 font-mono text-[12px] leading-snug text-black bg-white">
      <PrintTrigger />

      <div className="text-center mb-3">
        <p className="font-bold uppercase text-sm">{order.restaurant.name}</p>
        <p>Pedido #{order.id.slice(-5)}</p>
        <p>{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
      </div>

      <hr className="border-dashed border-black my-2" />

      <p><strong>Cliente:</strong> {order.customerName}</p>
      {order.customerPhone && <p><strong>Telefone:</strong> {order.customerPhone}</p>}
      <p>
        <strong>{order.deliveryType === "DINE_IN" ? "Mesa:" : "Entrega:"}</strong>{" "}
        {order.deliveryType === "DELIVERY" && "Entrega"}
        {order.deliveryType === "PICKUP" && "Retirada no local"}
        {order.deliveryType === "DINE_IN" && order.table?.label}
      </p>
      {order.deliveryType === "DELIVERY" && order.street && (
        <p>
          <strong>Endereço:</strong> {order.street}, {order.number}
          {order.complement ? ` - ${order.complement}` : ""}
          <br />
          {order.neighborhood} — {order.city}
          {order.referenceNote && <><br />Ref: {order.referenceNote}</>}
        </p>
      )}

      <hr className="border-dashed border-black my-2" />

      {order.items.map((item) => {
        const removed = Array.isArray(item.removedItems) ? (item.removedItems as string[]) : [];
        const extras = Array.isArray(item.extras) ? (item.extras as { name: string; priceCents: number }[]) : [];
        const selectedOptions = Array.isArray(item.selectedOptions)
          ? (item.selectedOptions as { groupName: string; items: { name: string }[] }[])
          : [];
        return (
          <div key={item.id} className="mb-1.5">
            <div className="flex justify-between">
              <span>{item.qty}x {item.productName}</span>
              <span>{currency(item.unitPriceCents * item.qty)}</span>
            </div>
            {item.categoryName && <p className="pl-3">({item.categoryName})</p>}
            {selectedOptions.map((group, gi) => (
              <p key={gi} className="pl-3">{group.groupName}: {group.items.map((i) => i.name).join(", ")}</p>
            ))}
            {removed.length > 0 && <p className="pl-3">Sem: {removed.join(", ")}</p>}
            {extras.length > 0 && <p className="pl-3">+ {extras.map((e) => e.name).join(", ")}</p>}
          </div>
        );
      })}

      <hr className="border-dashed border-black my-2" />

      {(() => {
        const itemsSubtotalCents = order.items.reduce((s, item) => s + item.unitPriceCents * item.qty, 0);
        const hasAdjustments =
          order.discountCents > 0 ||
          order.loyaltyDiscountCents > 0 ||
          order.cashbackUsedCents > 0 ||
          (order.deliveryType === "DELIVERY" && order.deliveryFeeCents > 0);

        if (!hasAdjustments) return null;

        return (
          <>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currency(itemsSubtotalCents)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between">
                <span>Cupom</span>
                <span>-{currency(order.discountCents)}</span>
              </div>
            )}
            {order.loyaltyDiscountCents > 0 && (
              <div className="flex justify-between">
                <span>Pontos resgatados</span>
                <span>-{currency(order.loyaltyDiscountCents)}</span>
              </div>
            )}
            {order.deliveryType === "DELIVERY" && order.deliveryFeeCents > 0 && (
              <div className="flex justify-between">
                <span>Taxa de entrega</span>
                <span>{currency(order.deliveryFeeCents)}</span>
              </div>
            )}
            {order.cashbackUsedCents > 0 && (
              <div className="flex justify-between">
                <span>Cashback usado</span>
                <span>-{currency(order.cashbackUsedCents)}</span>
              </div>
            )}
          </>
        );
      })()}
      <div className="flex justify-between font-bold">
        <span>TOTAL</span>
        <span>{currency(order.totalCents)}</span>
      </div>
      <p className="mt-1"><strong>Pagamento:</strong> {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
      {order.paymentMethod === "CASH" && order.changeForCents && (
        <p>
          <strong>Troco para:</strong> {currency(order.changeForCents)} (levar {currency(order.changeForCents - order.totalCents)})
        </p>
      )}
    </div>

    {order.restaurant.printKitchenCopy && (
    <div className="max-w-[300px] mx-auto p-4 font-mono text-[12px] leading-snug text-black bg-white" style={{ pageBreakBefore: "always" }}>
      <div className="text-center mb-3">
        <p className="font-bold uppercase text-sm">VIA DA COZINHA</p>
        <p>Pedido #{order.id.slice(-5)}</p>
        <p>{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
      </div>

      <hr className="border-dashed border-black my-2" />

      <p><strong>Cliente:</strong> {order.customerName}</p>
      {order.customerPhone && <p><strong>Telefone:</strong> {order.customerPhone}</p>}
      {order.deliveryType === "DINE_IN" && order.table && <p><strong>Mesa:</strong> {order.table.label}</p>}

      <hr className="border-dashed border-black my-2" />

      {order.items.map((item) => {
        const removed = Array.isArray(item.removedItems) ? (item.removedItems as string[]) : [];
        const extras = Array.isArray(item.extras) ? (item.extras as { name: string }[]) : [];
        const selectedOptions = Array.isArray(item.selectedOptions)
          ? (item.selectedOptions as { groupName: string; items: { name: string }[] }[])
          : [];
        return (
          <div key={item.id} className="mb-1.5">
            <p>{item.qty}x {item.productName}</p>
            {item.categoryName && <p className="pl-3">({item.categoryName})</p>}
            {selectedOptions.map((group, gi) => (
              <p key={gi} className="pl-3">{group.groupName}: {group.items.map((i) => i.name).join(", ")}</p>
            ))}
            {removed.length > 0 && <p className="pl-3">Sem: {removed.join(", ")}</p>}
            {extras.length > 0 && <p className="pl-3">+ {extras.map((e) => e.name).join(", ")}</p>}
          </div>
        );
      })}
    </div>
    )}
    </>
  );
}
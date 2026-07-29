/**
 * Cliente HTTP para o serviço notifications-api (repo separado).
 *
 * Contrato esperado do notifications-api (definir/ajustar lá):
 *   POST /events/order-created        { restaurantId, orderId, customerName, totalCents }
 *   POST /events/order-status-changed { restaurantId, orderId, status }
 *   Header: Authorization: Bearer <NOTIFICATIONS_API_KEY>
 *
 * O notifications-api é responsável por:
 *   - emitir via Socket.IO pro painel admin conectado (tempo real)
 *   - disparar e-mail via Nodemailer pro cliente quando o status mudar
 *
 * Se essa chamada falhar, NUNCA deve derrubar o fluxo de pedido/pagamento —
 * notificação é best-effort. Por isso engolimos o erro e só logamos.
 */

const NOTIFICATIONS_API_URL = process.env.NOTIFICATIONS_API_URL ?? "http://localhost:4000";
const NOTIFICATIONS_API_KEY = process.env.NOTIFICATIONS_API_KEY ?? "";

async function post(path: string, body: unknown) {
  try {
    const res = await fetch(`${NOTIFICATIONS_API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NOTIFICATIONS_API_KEY}`,
      },
      body: JSON.stringify(body),
      // timeout curto: notificação não pode travar o checkout do cliente
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      console.error(`[notifications-client] ${path} -> HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[notifications-client] falha ao chamar ${path}:`, err);
  }
}

export const notificationsClient = {
  orderCreated: (params: { restaurantId: string; orderId: string; customerName: string; totalCents: number }) =>
    post("/events/order-created", params),

  orderStatusChanged: (params: { restaurantId: string; orderId: string; status: string }) =>
    post("/events/order-status-changed", params),
};
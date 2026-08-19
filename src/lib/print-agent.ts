import { Capacitor } from "@capacitor/core";

/**
 * Verifica se o código está rodando dentro do aplicativo nativo Android/iOS
 */
export async function isMenuairApp(): Promise<boolean> {
  return Capacitor.isNativePlatform();
}

// Se a impressora não responder dentro desse tempo, desiste — evita a
// tentativa de impressão ficar pendurada esperando uma impressora
// desligada ou fora da rede.
const CONNECT_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} não respondeu em ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Dispara a impressão silenciosa via Socket TCP direto para o IP da
 * impressora. NUNCA lança erro — sempre devolve true/false, pra quem
 * chama não precisar de try/catch. Falha vira log + false, ponto.
 */
export async function printViaAgent(
  hexData: string,
  printerIp: string,
  printerPort: number = 9100
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.warn("Impressão via Agent disponível apenas dentro do App Nativo.");
    return false;
  }

  if (!printerIp) {
    console.warn("Impressão via Agent: IP da impressora não configurado.");
    return false;
  }

  let socketId: number | null = null;

  try {
    const { TcpSocket, DataEncoding } = await import("capacitor-tcp-socket");

    const connection = await withTimeout(
      TcpSocket.connect({ ipAddress: printerIp, port: printerPort || 9100 }),
      CONNECT_TIMEOUT_MS,
      "conexão com a impressora"
    );
    socketId = connection.client;

    await withTimeout(
      TcpSocket.send({ client: socketId, data: hexData, encoding: DataEncoding.HEX }),
      CONNECT_TIMEOUT_MS,
      "envio dos dados"
    );

    await TcpSocket.disconnect({ client: socketId });
    return true;
  } catch (error) {
    console.error("Erro ao imprimir via TCP no App:", error);

    if (socketId !== null) {
      try {
        const { TcpSocket } = await import("capacitor-tcp-socket");
        await TcpSocket.disconnect({ client: socketId });
      } catch {
        // Já deu erro, e agora nem consegue fechar a conexão — não tem
        // mais nada útil a fazer aqui além de deixar seguir. O próximo
        // pedido tenta uma conexão nova, independente desta.
      }
    }

    return false;
  }
}
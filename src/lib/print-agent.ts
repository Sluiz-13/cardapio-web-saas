import { Capacitor } from "@capacitor/core";

/**
 * Verifica se o código está rodando dentro do aplicativo nativo Android/iOS
 */
export async function isMenuairApp(): Promise<boolean> {
  return Capacitor.isNativePlatform();
}

/**
 * Dispara a impressão silenciosa via Socket TCP direto para o IP da impressora
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

  let socketId: number | null = null;

  try {
    // Importação dinâmica para evitar erros de build no servidor SSR do Next.js
    const { TcpSocket, DataEncoding } = await import("capacitor-tcp-socket");

    // 1. Conecta ao Socket TCP da impressora (porta padrão 9100)
    const connection = await TcpSocket.connect({
      ipAddress: printerIp,
      port: printerPort || 9100,
    });

    socketId = connection.client;

    // 2. Envia os dados hex do cupom ESC/POS
    await TcpSocket.send({
      client: socketId,
      data: hexData,
      encoding: DataEncoding.HEX,
    });

    // 3. Fecha a conexão com a impressora
    await TcpSocket.disconnect({ client: socketId });
    return true;
  } catch (error) {
    console.error("Erro ao imprimir via TCP no App:", error);

    // Tenta fechar o socket em caso de erro na transmissão
    if (socketId !== null) {
      try {
        const { TcpSocket } = await import("capacitor-tcp-socket");
        await TcpSocket.disconnect({ client: socketId });
      } catch (_) {}
    }

    throw error;
  }
}
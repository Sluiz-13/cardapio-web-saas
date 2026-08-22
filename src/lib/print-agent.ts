import { Capacitor } from "@capacitor/core";

/**
 * Verifica se o código está rodando dentro do aplicativo nativo Android/iOS
 */
export async function isMenuairApp(): Promise<boolean> {
  return Capacitor.isNativePlatform();
}

const CONNECT_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} não respondeu em ${ms}ms`)), ms)
    ),
  ]);
}

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
        // Ignora erros ao fechar socket em erro
      }
    }
    return false;
  }
}

/**
 * Lista as impressoras Bluetooth já pareadas no celular
 */
export async function listPairedBluetoothPrinters(): Promise<{
  devices: { name: string; address: string }[];
  error: string | null;
}> {
  if (!Capacitor.isNativePlatform()) return { devices: [], error: null };

  try {
    const { BluetoothPrinter } = await import(
      "@kduma-autoid/capacitor-bluetooth-printer"
    );
    const { devices } = await BluetoothPrinter.list();
    return { devices: devices.map((d) => ({ name: d.name, address: d.address })), error: null };
  } catch (error) {
    console.error("Erro ao listar impressoras Bluetooth:", error);
    // Devolve a mensagem de verdade — geralmente é erro de permissão negada
    // no Android 12+, não "nenhuma impressora encontrada".
    const message = error instanceof Error ? error.message : String(error);
    return { devices: [], error: message };
  }
}

// Converte hex pra base64 sem depender de Buffer
function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  );
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

// Bluetooth Classic pode legitimamente demorar mais que Wi-Fi pra conectar
// (reconexão de rádio, handshake), por isso o timeout aqui é maior que o
// da versão TCP.
const BLUETOOTH_TIMEOUT_MS = 8000;

export async function printViaBluetoothAgent(
  hexData: string,
  address: string
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.warn("Impressão via Bluetooth disponível apenas dentro do App Nativo.");
    return false;
  }

  if (!address) {
    console.warn("Impressão via Bluetooth: endereço da impressora não configurado.");
    return false;
  }

  try {
    const { BluetoothPrinter } = await import(
      "@kduma-autoid/capacitor-bluetooth-printer"
    );
    await withTimeout(
      BluetoothPrinter.connectAndPrint({
        address,
        data: hexToBase64(hexData),
      }),
      BLUETOOTH_TIMEOUT_MS,
      "impressora Bluetooth"
    );
    return true;
  } catch (error) {
    console.error("Erro ao imprimir via Bluetooth:", error);
    return false;
  }
}
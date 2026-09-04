async function getQz() {
  const qzModule = await import("qz-tray");
  return qzModule.default;
}

export async function ensureQzConnected(): Promise<boolean> {
  try {
    const qz = await getQz();
    if (qz.websocket.isActive()) return true;
    await qz.websocket.connect();
    return true;
  } catch (error) {
    console.error("QZ Tray não conectou — está instalado e aberto no PC?", error);
    return false;
  }
}

export async function listQzPrinters(): Promise<string[]> {
  const connected = await ensureQzConnected();
  if (!connected) return [];
  try {
    const qz = await getQz();
    const found = await qz.printers.find();
    return Array.isArray(found) ? found : [found];
  } catch (error) {
    console.error("Erro ao listar impressoras do QZ Tray:", error);
    return [];
  }
}

export async function printViaQzTray(hex: string, printerName: string): Promise<boolean> {
  try {
    const connected = await ensureQzConnected();
    if (!connected) return false;

    const qz = await getQz();
    const config = qz.configs.create(printerName);
    const base64 = hexToBase64(hex);
    const data = [{ type: "raw" as const, format: "base64" as const, data: base64 }];

    await qz.print(config, data);
    return true;
  } catch (error) {
    console.error("Erro ao imprimir via QZ Tray:", error);
    return false;
  }
}

function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}
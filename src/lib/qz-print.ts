
const QZ_PUBLIC_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIDpzCCAo+gAwIBAgIUCvHme3oHWodp4NfEHz6QqvOGMskwDQYJKoZIhvcNAQEL
BQAwYzELMAkGA1UEBhMCQlIxCzAJBgNVBAgMAlNQMREwDwYDVQQHDAhTYW9QYXVs
bzEQMA4GA1UECgwHTWVudWFpcjEQMA4GA1UECwwHTWVudWFpcjEQMA4GA1UEAwwH
TWVudWFpcjAeFw0yNjA5MDQwMTE0MjJaFw0zNjA5MDEwMTE0MjJaMGMxCzAJBgNV
BAYTAkJSMQswCQYDVQQIDAJTUDERMA8GA1UEBwwIU2FvUGF1bG8xEDAOBgNVBAoM
B01lbnVhaXIxEDAOBgNVBAsMB01lbnVhaXIxEDAOBgNVBAMMB01lbnVhaXIwggEi
MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDabhfG1m3KkaJKww5tDARjYQS9
QnQbMLlnG+Q/ZbMir1MsefFsNXxxmmHqVli1I3wGwAbmpQ0zCaMYsF9qkqBV4+2x
rSzsgLFb4K1ekl8O+qTCWjHKXJgaOtNfpJhQvZ/Bue2QaRrRXkDWm3nWcfv10Lf6
PKxm+B7r+cqUIP5WdwYyJF9o0+B1do805On4aNTOeQstYxXzSeXuT3YcCGCD0v+Q
ncJTX31rU4VVfrJ/cJ6B1HRxl34WsU8kucshub/EaNzI9sfDXqVcjy6ASYytrFa5
KmcroLFaxG04LvO90GxMI5n53TrGOlgf8TTtbK3ILMqektEFipyBhcNPRVKXAgMB
AAGjUzBRMB0GA1UdDgQWBBRKDwsEDibeClRMxAOv55jrmCdzkjAfBgNVHSMEGDAW
gBRKDwsEDibeClRMxAOv55jrmCdzkjAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3
DQEBCwUAA4IBAQCrxaY5ubF2CwTy8Ci57oAbhaWTu9V+tzp4tVkxYQMWJblQLBme
h1mZCZ/QOjKTL2UrKD0VZBF+suiQ61lACzXdMyXeTzcGvqJDPLIf3AX+Okv914UJ
6nfuzZRU+x5hXrl/P4uwVUjVj6+mtihZg/UYvSc+pGWSIkebWLzg3hRJsOLHMmv0
CWuRbLY6dStKJuGjLbJ/pqUFM6y+9Hp2xUhGqIDc5zyXaEboELLcE8o3nwjSf50l
D712jWMr3OsfDCqVUtWRz3QKS3H6KHOkGEbdNh9Xiw2KMvTZaYhSKNcHYYeBbX3a
L0GgerwqffxVbYe6w9Cv8OzLGYZHZZ3I4QSo
-----END CERTIFICATE-----`;

let securityConfigured = false;

function configureQzSecurity(qz: any) {
  if (securityConfigured) return;

  qz.security.setCertificatePromise((resolve: (cert: string) => void) => {
    resolve(QZ_PUBLIC_CERTIFICATE);
  });

  qz.security.setSignatureAlgorithm("SHA512");

  qz.security.setSignaturePromise((toSign: string) => {
    return (resolve: (sig: string) => void, reject: (err: unknown) => void) => {
      fetch("/api/admin/qz-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toSign }),
      })
        .then((res) => res.json())
        .then((data) => (data.signature ? resolve(data.signature) : reject(data.error)))
        .catch(reject);
    };
  });

  securityConfigured = true;
}

async function getQz() {
  const qzModule = await import("qz-tray");
  return qzModule.default;
}

export async function ensureQzConnected(): Promise<boolean> {
  try {
    const qz = await getQz();
    if (qz.websocket.isActive()) return true;
    configureQzSecurity(qz);
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
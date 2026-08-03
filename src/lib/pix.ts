/**
 * Gera o payload "Pix Copia e Cola" no padrão EMV/BR Code do Banco Central.
 * Não depende de nenhuma API externa — é só formatação de texto + checksum,
 * o mesmo formato que qualquer QR Code Pix estático usa.
 */

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(value: string, maxLength: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

/**
 * Normaliza a chave Pix pro formato exato que o Banco Central exige por
 * tipo — não importa como o admin digitou (com pontuação, espaço, etc), o
 * valor embutido no QR Code sempre sai correto. Isso é crítico: uma chave
 * mal formatada faz o banco recebedor rejeitar o pagamento mesmo com o QR
 * Code sendo lido normalmente.
 */
export function normalizePixKey(pixKey: string, pixKeyType?: string | null): string {
  const trimmed = pixKey.trim();
  switch (pixKeyType) {
    case "CPF":
    case "CNPJ":
      return trimmed.replace(/\D/g, "");
    case "PHONE": {
      const digits = trimmed.replace(/\D/g, "");
      const withCountryCode = digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`;
      return `+${withCountryCode}`;
    }
    case "EMAIL":
      return trimmed.toLowerCase();
    case "RANDOM":
    default:
      return trimmed;
  }
}

export function generatePixPayload(params: {
  pixKey: string;
  pixKeyType?: string | null;
  merchantName: string;
  merchantCity: string;
  amountCents?: number;
  txid?: string;
}): string {
  const normalizedKey = normalizePixKey(params.pixKey, params.pixKeyType);
  const merchantName = sanitize(params.merchantName, 25) || "RESTAURANTE";
  const merchantCity = sanitize(params.merchantCity, 15) || "BRASIL";
  const txid = sanitize(params.txid ?? "", 25) || "***";

  const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", normalizedKey);

  let payload =
    tlv("00", "01") + // Payload Format Indicator
    tlv("01", "11") + // Point of Initiation Method: 11 = QR estático
    tlv("26", merchantAccountInfo) +
    tlv("52", "0000") +
    tlv("53", "986");

  if (params.amountCents && params.amountCents > 0) {
    payload += tlv("54", (params.amountCents / 100).toFixed(2));
  }

  payload +=
    tlv("58", "BR") +
    tlv("59", merchantName) +
    tlv("60", merchantCity) +
    tlv("62", tlv("05", txid));

  const withCrcPlaceholder = `${payload}6304`;
  return `${withCrcPlaceholder}${crc16(withCrcPlaceholder)}`;
}
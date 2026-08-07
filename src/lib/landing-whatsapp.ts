import { buildWhatsAppLink } from "./whatsapp";

const CONTACT_PHONE = "35999603944";

export function landingWhatsAppLink(message: string): string {
  return buildWhatsAppLink(CONTACT_PHONE, message);
}
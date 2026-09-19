import { buildWhatsAppLink } from "./whatsapp";

const CONTACT_PHONE = "3599722478";

export function landingWhatsAppLink(message: string): string {
  return buildWhatsAppLink(CONTACT_PHONE, message);
}
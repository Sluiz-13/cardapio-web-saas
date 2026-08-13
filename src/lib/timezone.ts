const RESTAURANT_TIMEZONE = "America/Sao_Paulo";

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Retorna dia da semana e hora/minuto SEMPRE no fuso de Brasília,
 * independente do fuso horário configurado no servidor.
 *
 * Por quê isso existe: código rodando no servidor (Server Components,
 * API routes) usa o relógio/fuso do sistema operacional da máquina —
 * e VPS geralmente vem configurada em UTC por padrão. Usar
 * `date.getHours()`/`date.getDay()` puro ali resultaria em "agora" 3h
 * à frente do horário real de Brasília. Este helper sempre calcula
 * certo, não importa como a VPS esteja configurada.
 */
export function getBrazilTimeParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    dayOfWeek: WEEKDAY_MAP[get("weekday")] ?? date.getDay(),
    hours: Number(get("hour")) % 24, // Intl às vezes devolve "24" pra meia-noite
    minutes: Number(get("minute")),
  };
}
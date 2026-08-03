/**
 * Toca um bipe curto de notificação usando Web Audio API — sem depender de
 * nenhum arquivo de áudio externo (mp3/wav). Navegadores bloqueiam som
 * automático antes da primeira interação do usuário na página; como o admin
 * sempre clica em algo antes (login, navegar entre abas), isso já libera.
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();

    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.15);
    playTone(1108, now + 0.15, 0.2);
  } catch {
    // Se o navegador bloquear (política de autoplay), falha em silêncio —
    // o piscar visual do pedido continua funcionando normalmente.
  }
}
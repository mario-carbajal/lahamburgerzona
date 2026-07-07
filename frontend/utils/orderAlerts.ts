// Sonido de aviso para pedidos nuevos en el panel admin.
// Usa Web Audio API (sin archivos externos); dos tonos cortos tipo campana.
export const playNewOrderSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const beep = (freq: number, startAt: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startAt);
      osc.stop(ctx.currentTime + startAt + duration + 0.05);
    };

    beep(880, 0, 0.25);
    beep(1175, 0.3, 0.35);

    // Liberar el contexto cuando termine el sonido
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    // El navegador puede bloquear audio sin interacción previa; no es crítico.
  }
};

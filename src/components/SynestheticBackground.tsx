import { useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';

/**
 * Full-viewport Canvas background: morphing fluid blobs + soundwave ripples.
 * Synesthetic: ripple speed / color energy increases when audio is playing;
 * pointer position gently pulls fluid centers.
 * Pure Canvas 2D + requestAnimationFrame — no extra deps.
 */
export function SynestheticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying } = usePlayer();
  const playingRef = useRef(isPlaying);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let time = 0;

    const pointer = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 };

    type Blob = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      hue: number;
      phase: number;
    };

    type Ripple = {
      x: number;
      y: number;
      radius: number;
      max: number;
      life: number;
      hue: number;
    };

    const blobs: Blob[] = [];
    const ripples: Ripple[] = [];
    let rippleTimer = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (blobs.length === 0) {
        const hues = [18, 330, 280, 200, 45];
        for (let i = 0; i < 5; i++) {
          blobs.push({
            x: 0.15 + Math.random() * 0.7,
            y: 0.15 + Math.random() * 0.7,
            r: 120 + Math.random() * 180,
            vx: (Math.random() - 0.5) * 0.00015,
            vy: (Math.random() - 0.5) * 0.00015,
            hue: hues[i % hues.length],
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const onPointer = (e: PointerEvent) => {
      pointer.tx = e.clientX / w;
      pointer.ty = e.clientY / h;
    };

    const spawnRipple = (cx: number, cy: number, hue: number) => {
      ripples.push({
        x: cx,
        y: cy,
        radius: 8,
        max: 180 + Math.random() * 120,
        life: 1,
        hue,
      });
      if (ripples.length > 12) ripples.shift();
    };

    const tick = (ts: number) => {
      const dt = Math.min(32, ts - (tick as unknown as { last?: number }).last! || 16);
      (tick as unknown as { last?: number }).last = ts;
      time += dt;

      let energy = playingRef.current ? 1.35 : 1;
    const snap = getAnalyserRef.current?.();
    if (snap && playingRef.current) {
      // Map analyser energy/bass into motion multiplier (1 → ~2.4)
      energy = 1.15 + snap.energy * 1.1 + snap.bass * 0.9;
    }
      const speedMul = playingRef.current ? 1.8 : 1;

      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;

      ctx.clearRect(0, 0, w, h);

      // Deep base wash
      const base = ctx.createRadialGradient(
        w * pointer.x,
        h * pointer.y,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.85,
      );
      base.addColorStop(0, 'rgba(12, 10, 16, 0.0)');
      base.addColorStop(1, 'rgba(6, 6, 10, 0.35)');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // Fluid blobs
      ctx.globalCompositeOperation = 'lighter';
      for (const b of blobs) {
        b.phase += 0.008 * speedMul;
        b.x += b.vx * speedMul * 60;
        b.y += b.vy * speedMul * 60;

        // Soft pull toward pointer
        b.x += (pointer.x - b.x) * 0.0008 * energy;
        b.y += (pointer.y - b.y) * 0.0008 * energy;

        if (b.x < -0.1 || b.x > 1.1) b.vx *= -1;
        if (b.y < -0.1 || b.y > 1.1) b.vy *= -1;
        b.x = Math.max(-0.15, Math.min(1.15, b.x));
        b.y = Math.max(-0.15, Math.min(1.15, b.y));

        const pulse = 1 + Math.sin(b.phase) * 0.12 * energy;
        const radius = b.r * pulse;
        const cx = b.x * w;
        const cy = b.y * h;

        const hueShift = playingRef.current ? 12 * Math.sin(time * 0.001) : 0;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g.addColorStop(0, `hsla(${b.hue + hueShift}, 85%, 55%, ${0.11 * energy})`);
        g.addColorStop(0.45, `hsla(${b.hue + 20 + hueShift}, 70%, 40%, ${0.05 * energy})`);
        g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Soundwave ripples
      rippleTimer += dt * speedMul;
      const interval = playingRef.current ? 700 : 1600;
      if (rippleTimer > interval) {
        rippleTimer = 0;
        const host = blobs[Math.floor(Math.random() * blobs.length)];
        spawnRipple(host.x * w, host.y * h, host.hue);
        if (playingRef.current) {
          spawnRipple(pointer.x * w, pointer.y * h, 25);
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += (0.9 + energy * 0.5) * (dt / 16);
        r.life -= dt / (r.max * 14);
        if (r.life <= 0 || r.radius > r.max) {
          ripples.splice(i, 1);
          continue;
        }
        const alpha = Math.max(0, r.life * 0.22 * energy);
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${r.hue}, 80%, 60%, ${alpha})`;
        ctx.lineWidth = 1.25 + energy * 0.5;
        ctx.stroke();

        // Secondary faint ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${r.hue + 30}, 70%, 55%, ${alpha * 0.45})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: 'transparent' }}
    />
  );
}

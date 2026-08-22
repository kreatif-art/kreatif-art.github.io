import { useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Number of bars */
  bars?: number;
  height?: number;
};

/**
 * Live frequency bars driven by PlayerContext analyser.
 * Renders on canvas; zero React re-renders per frame.
 */
export function AudioBars({ className, bars = 24, height = 28 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, getAnalyserData, currentTrack } = usePlayer();
  const playingRef = useRef(isPlaying);
  const getRef = useRef(getAnalyserData);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    getRef.current = getAnalyserData;
  }, [getAnalyserData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.clientWidth || 120;
      const h = height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = () => {
      const w = canvas.clientWidth || 120;
      const h = height;
      ctx.clearRect(0, 0, w, h);

      const snap = getRef.current?.();
      const gap = 2;
      const barW = Math.max(2, (w - gap * (bars - 1)) / bars);

      if (snap && playingRef.current) {
        const freq = snap.frequency;
        const step = Math.max(1, Math.floor(freq.length / bars));
        for (let i = 0; i < bars; i++) {
          let sum = 0;
          const start = i * step;
          for (let j = 0; j < step && start + j < freq.length; j++) sum += freq[start + j];
          const avg = sum / step / 255;
          const bh = Math.max(2, avg * h * 0.95);
          const x = i * (barW + gap);
          const y = (h - bh) / 2;
          const g = ctx.createLinearGradient(0, y, 0, y + bh);
          g.addColorStop(0, 'rgba(251, 146, 60, 0.95)');
          g.addColorStop(1, 'rgba(244, 114, 182, 0.85)');
          ctx.fillStyle = g;
          ctx.beginPath();
          const r = Math.min(2, barW / 2);
          ctx.roundRect(x, y, barW, bh, r);
          ctx.fill();
        }
      } else {
        // Idle dots
        for (let i = 0; i < bars; i++) {
          const x = i * (barW + gap);
          const bh = 3;
          const y = (h - bh) / 2;
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath();
          ctx.roundRect(x, y, barW, bh, 1);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [bars, height]);

  if (!currentTrack) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-24 shrink-0 opacity-90', className)}
      style={{ height }}
      aria-hidden
    />
  );
}

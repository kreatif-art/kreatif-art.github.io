import { useEffect, useState } from 'react';

/**
 * Intro foyer: full-screen loader with auction gavel motif + percentage.
 * Shows once per session (sessionStorage).
 */
export function IntroLoader({ onDone }: { onDone?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(() => {
    try {
      return sessionStorage.getItem('kreatif-intro-done') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (gone) {
      onDone?.();
      return;
    }

    let raf = 0;
    const start = performance.now();
    const duration = 1600;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setTimeout(() => setLeaving(true), 280);
        setTimeout(() => {
          try {
            sessionStorage.setItem('kreatif-intro-done', '1');
          } catch {
            /* ignore */
          }
          setGone(true);
          onDone?.();
        }, 900);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gone, onDone]);

  if (gone) return null;

  return (
    <div
      className={`intro-loader fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0b] ${
        leaving ? 'intro-loader--out' : ''
      }`}
      aria-hidden={leaving}
    >
      <div className="mb-8 flex flex-col items-center gap-4" aria-hidden>
        <img
          src="/logo.png"
          alt=""
          className="h-24 w-24 rounded-lg object-cover shadow-[0_0_40px_rgba(255,255,255,0.08)] sm:h-28 sm:w-28"
        />
        <p className="label-caps text-neutral-500">Kreatif</p>
      </div>

      <div className="hero-title text-7xl text-white sm:text-8xl md:text-9xl">
        {String(progress).padStart(2, '0')}
      </div>
      <div className="mt-10 h-px w-24 overflow-hidden bg-white/10">
        <div
          className="h-full bg-white/70 transition-[width] duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-neutral-600">Opening the room</p>
    </div>
  );
}

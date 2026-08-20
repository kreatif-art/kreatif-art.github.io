import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Two-panel Sound ↔ Sight chapter.
 * Left = Music · Right = Art
 */
export function SoundSightChapter() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, x: 0, left: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(dx) < 1) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;
      if (!inView) return;
      el.scrollLeft += dx;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <section className="relative border-y border-white/[0.06] bg-black/50" aria-label="Sound and Sight">
      <div
        ref={ref}
        className="chapter-rail flex h-[min(58vh,440px)] touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        onPointerDown={(e) => {
          const el = ref.current;
          if (!el || (e.target as HTMLElement).closest('a, button')) return;
          drag.current = { active: true, x: e.clientX, left: el.scrollLeft };
          el.setPointerCapture(e.pointerId);
          el.classList.add('is-dragging');
        }}
        onPointerMove={(e) => {
          if (!drag.current.active || !ref.current) return;
          ref.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
        }}
        onPointerUp={(e) => {
          drag.current.active = false;
          ref.current?.classList.remove('is-dragging');
          try {
            ref.current?.releasePointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }}
        onPointerCancel={() => {
          drag.current.active = false;
          ref.current?.classList.remove('is-dragging');
        }}
      >
        {/* Music */}
        <div className="chapter-panel relative flex w-screen shrink-0 snap-center flex-col items-center justify-center px-6">
          <p className="label-caps mb-3 text-orange-400/70">← Music</p>
          <h2 className="text-center text-5xl text-white sm:text-6xl">
            <span className="font-musicnet not-italic text-orange-300">Music</span>
          </h2>
          <p className="mt-3 max-w-xs text-center text-sm text-neutral-400">
            Original tracks from the community.
          </p>
          <Link
            to="/browse/music"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-5 py-2.5 text-sm text-orange-100 transition-colors hover:bg-orange-500/20"
          >
            <ArrowLeft className="h-4 w-4" /> Enter music
          </Link>
          <p className="absolute bottom-5 text-[10px] uppercase tracking-[0.18em] text-neutral-600">
            Swipe right for art →
          </p>
        </div>

        {/* Art */}
        <div className="chapter-panel relative flex w-screen shrink-0 snap-center flex-col items-center justify-center px-6">
          <p className="label-caps mb-3 text-pink-400/70">Art →</p>
          <h2 className="text-center text-5xl text-white sm:text-6xl">
            <span className="font-arthure not-italic text-pink-300">Art</span>
          </h2>
          <p className="mt-3 max-w-xs text-center text-sm text-neutral-400">
            Visual work from independent creators.
          </p>
          <Link
            to="/browse/art"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-5 py-2.5 text-sm text-pink-100 transition-colors hover:bg-pink-500/20"
          >
            Enter art <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="absolute bottom-5 text-[10px] uppercase tracking-[0.18em] text-neutral-600">
            ← Swipe left for music
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
        <span className="h-1 w-6 rounded-full bg-orange-400/45" />
        <span className="h-1 w-6 rounded-full bg-pink-400/45" />
      </div>
    </section>
  );
}

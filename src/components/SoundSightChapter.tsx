import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Full-viewport horizontal chapter between Sound and Sight rails.
 * Swipe/drag/wheel across panels: Sound → Bridge → Sight.
 * Mobile + desktop.
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
      // Only capture when chapter is in view and horizontal intent
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
      if (!inView) return;
      el.scrollLeft += dx;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <section className="relative border-y border-white/[0.06] bg-black/40" aria-label="Sound and Sight chapter">
      <div
        ref={ref}
        className="chapter-rail flex h-[min(70vh,520px)] touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
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
        {/* Panel 1 — Sound */}
        <div className="chapter-panel relative flex w-screen shrink-0 snap-center flex-col items-center justify-center px-6">
          <p className="label-caps mb-4 text-orange-400/80">Chapter · I</p>
          <h2 className="max-w-lg text-center text-4xl text-white sm:text-6xl">
            <span className="font-musicnet not-italic text-orange-300">Sound</span>
          </h2>
          <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-neutral-400">
            Tracks that move — swipe into the music reel, or open the full archive.
          </p>
          <Link
            to="/browse/music"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-5 py-2 text-sm text-orange-200 transition-colors hover:bg-orange-500/20"
          >
            Enter music <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="absolute bottom-6 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
            Swipe right →
          </p>
        </div>

        {/* Panel 2 — Bridge */}
        <div className="chapter-panel relative flex w-screen shrink-0 snap-center flex-col items-center justify-center px-6">
          <p className="label-caps mb-4 text-neutral-500">Where they meet</p>
          <h2 className="max-w-xl text-center text-3xl text-white sm:text-5xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}>
            Sound &amp; Sight
          </h2>
          <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-neutral-400">
            Equal weight. One platform. Original work only — music and visual art sharing the same stage.
          </p>
          <div className="mt-10 flex gap-8 text-neutral-600">
            <span className="font-musicnet text-2xl text-orange-400/40">music</span>
            <span className="text-neutral-700">×</span>
            <span className="font-arthure text-2xl text-pink-400/40">art</span>
          </div>
        </div>

        {/* Panel 3 — Sight */}
        <div className="chapter-panel relative flex w-screen shrink-0 snap-center flex-col items-center justify-center px-6">
          <p className="label-caps mb-4 text-pink-400/80">Chapter · II</p>
          <h2 className="max-w-lg text-center text-4xl text-white sm:text-6xl">
            <span className="font-arthure not-italic text-pink-300">Sight</span>
          </h2>
          <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-neutral-400">
            Images that hold — swipe into the art reel, or explore the full gallery.
          </p>
          <Link
            to="/browse/art"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-5 py-2 text-sm text-pink-200 transition-colors hover:bg-pink-500/20"
          >
            <ArrowLeft className="h-4 w-4" /> Enter art
          </Link>
          <p className="absolute bottom-6 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
            ← Swipe left
          </p>
        </div>
      </div>

      {/* Progress dots (decorative; snap handles navigation) */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        <span className="h-1 w-6 rounded-full bg-orange-400/50" />
        <span className="h-1 w-6 rounded-full bg-white/20" />
        <span className="h-1 w-6 rounded-full bg-pink-400/50" />
      </div>
    </section>
  );
}

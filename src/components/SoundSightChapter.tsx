import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Primary Sound ↔ Sight chapter.
 * Swipe left → Music · Swipe right → Art
 */
export function SoundSightChapter() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, x: 0, left: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Start on center panel (bridge)
    requestAnimationFrame(() => {
      el.scrollLeft = el.clientWidth;
    });
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
        className="chapter-rail flex h-[min(72vh,560px)] touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
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
        {/* LEFT panel — Music */}
        <div className="chapter-panel relative flex w-screen shrink-0 snap-center flex-col items-center justify-center px-6">
          <p className="label-caps mb-3 text-orange-400/70">← Swipe left</p>
          <h2 className="text-center text-5xl text-white sm:text-7xl">
            <span className="font-musicnet not-italic text-orange-300">Music</span>
          </h2>
          <p className="mt-4 max-w-xs text-center text-sm text-neutral-400">
            Original tracks from the community.
          </p>
          <Link
            to="/browse/music"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-5 py-2.5 text-sm text-orange-100 transition-colors hover:bg-orange-500/20"
          >
            <ArrowLeft className="h-4 w-4" /> Enter music
          </Link>
        </div>

        {/* CENTER — hub */}
        <div className="chapter-panel relative flex w-screen shrink-0 snap-center flex-col items-center justify-center px-6">
          <p className="label-caps mb-4 text-neutral-500">Sound &amp; Sight</p>
          <h2
            className="max-w-lg text-center text-3xl text-white sm:text-5xl"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
          >
            Choose a direction
          </h2>
          <div className="mt-10 flex w-full max-w-md items-center justify-between gap-4 px-2">
            <div className="flex flex-1 flex-col items-start gap-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-orange-400/60">← Left</span>
              <span className="font-musicnet text-xl text-orange-300/90">music</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-1 flex-col items-end gap-1 text-right">
              <span className="text-[10px] uppercase tracking-[0.2em] text-pink-400/60">Right →</span>
              <span className="font-arthure text-xl text-pink-300/90">art</span>
            </div>
          </div>
          <p className="mt-10 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
            Swipe or drag
          </p>
        </div>

        {/* RIGHT panel — Art */}
        <div className="chapter-panel relative flex w-screen shrink-0 snap-center flex-col items-center justify-center px-6">
          <p className="label-caps mb-3 text-pink-400/70">Swipe right →</p>
          <h2 className="text-center text-5xl text-white sm:text-7xl">
            <span className="font-arthure not-italic text-pink-300">Art</span>
          </h2>
          <p className="mt-4 max-w-xs text-center text-sm text-neutral-400">
            Visual work from independent creators.
          </p>
          <Link
            to="/browse/art"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-5 py-2.5 text-sm text-pink-100 transition-colors hover:bg-pink-500/20"
          >
            Enter art <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        <span className="h-1 w-5 rounded-full bg-orange-400/40" />
        <span className="h-1.5 w-8 rounded-full bg-white/35" />
        <span className="h-1 w-5 rounded-full bg-pink-400/40" />
      </div>
    </section>
  );
}

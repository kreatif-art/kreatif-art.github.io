import { useRef, useEffect, type ReactNode, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  tone?: 'music' | 'art';
  /** Sticky side word (e.g. MUSIC / ART) */
  sideLabel?: string;
  className?: string;
};

/**
 * Award-style horizontal gallery:
 * - sticky side typography
 * - scroll-linked scale (center cards larger)
 * - wheel → horizontal, drag/touch scrub
 * - music LTR, art mirrored
 */
export function HorizontalRail({ children, tone = 'music', sideLabel, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ active: boolean; x: number; left: number; pid: number | null }>({
    active: false,
    x: 0,
    left: 0,
    pid: null,
  });

  // Wheel → horizontal (non-passive)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (dx === 0) return;
      el.scrollLeft += dx;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Scroll-linked scale
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      const cards = el.querySelectorAll<HTMLElement>('.rail-card');
      if (!cards.length) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      cards.forEach((card) => {
        const c = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(mid - c);
        const max = el.clientWidth * 0.55;
        const t = Math.min(1, dist / max);
        // 1 at center → 0.88 at edges
        const scale = 1 - t * 0.12;
        const opacity = 1 - t * 0.28;
        card.style.transform = `scale(${scale})`;
        card.style.opacity = String(opacity);
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [children]);

  const onPointerDown = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || (e.target as HTMLElement).closest('a, button')) return;
    drag.current = { active: true, x: e.clientX, left: el.scrollLeft, pid: e.pointerId };
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current.active || !ref.current) return;
    ref.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };

  const onPointerUp = (e: PointerEvent) => {
    drag.current.active = false;
    ref.current?.classList.remove('is-dragging');
    try {
      ref.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const label = sideLabel ?? (tone === 'music' ? 'MUSIC' : 'ART');
  const labelClass = tone === 'music' ? 'font-musicnet text-orange-400/25' : 'font-arthure text-pink-400/25';

  return (
    <div className={cn('rail-shell relative', className)}>
      {/* Sticky side typography */}
      <div
        className={cn(
          'pointer-events-none absolute top-0 z-[5] hidden h-full items-center md:flex',
          tone === 'music' ? 'left-0' : 'right-0',
        )}
        aria-hidden
      >
        <span
          className={cn(
            'select-none text-[clamp(3rem,8vw,6.5rem)] leading-none tracking-tight',
            labelClass,
          )}
          style={{
            writingMode: 'vertical-rl',
            transform: tone === 'music' ? 'rotate(180deg)' : undefined,
          }}
        >
          {label}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0a0a0b] to-transparent sm:w-12 md:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0a0a0b] to-transparent sm:w-12 md:w-16" />

      <div
        ref={ref}
        className={cn(
          'h-rail flex touch-pan-x gap-4 overflow-x-auto overscroll-x-contain pb-4 pt-2',
          tone === 'art' && 'flex-row-reverse',
          tone === 'music' ? 'md:pl-14' : 'md:pr-14',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="w-3 shrink-0 sm:w-5" aria-hidden />
        {children}
        <div className="w-8 shrink-0 sm:w-12" aria-hidden />
      </div>

      <p className="mt-1 text-center text-[10px] uppercase tracking-[0.18em] text-neutral-600 md:hidden">
        Swipe {tone === 'music' ? '→' : '←'} to explore
      </p>
    </div>
  );
}

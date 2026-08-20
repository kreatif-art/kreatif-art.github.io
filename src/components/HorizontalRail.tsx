import { useRef, useEffect, type ReactNode, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  tone?: 'music' | 'art';
  className?: string;
};

/**
 * Award-style horizontal gallery rail.
 * Vertical wheel → horizontal scroll. Drag to scrub. Scroll-snap.
 * Music rail flows LTR; art rail is mirrored (flex-row-reverse).
 */
export function HorizontalRail({ children, tone = 'music', className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ active: boolean; x: number; left: number }>({
    active: false,
    x: 0,
    left: 0,
  });

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

  const onPointerDown = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || (e.target as HTMLElement).closest('a, button')) return;
    drag.current = { active: true, x: e.clientX, left: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current.active || !ref.current) return;
    const dx = e.clientX - drag.current.x;
    ref.current.scrollLeft = drag.current.left - dx;
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

  return (
    <div className={cn('rail-shell relative', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0a0a0b] to-transparent sm:w-14" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0a0a0b] to-transparent sm:w-14" />

      <div
        ref={ref}
        className={cn('h-rail flex gap-4 overflow-x-auto pb-3 pt-1', tone === 'art' && 'flex-row-reverse')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="w-2 shrink-0 sm:w-4" aria-hidden />
        {children}
        <div className="w-8 shrink-0 sm:w-12" aria-hidden />
      </div>

      <p className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-neutral-600">
        {tone === 'music' ? 'Drag or scroll → sound' : 'Drag or scroll ← sight'}
      </p>
    </div>
  );
}

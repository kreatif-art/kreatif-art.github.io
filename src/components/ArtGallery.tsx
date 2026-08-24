import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import type { ContentItem } from '@/types';

const INTERVAL_MS = 3000;

type ArtGalleryProps = {
  pieces: ContentItem[];
  startIndex?: number;
  onClose: () => void;
};

export function ArtGallery({ pieces, startIndex = 0, onClose }: ArtGalleryProps) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, startIndex), Math.max(0, pieces.length - 1)),
  );
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(Date.now());

  const len = pieces.length;
  const current = pieces[index];

  const go = useCallback(
    (delta: number) => {
      if (len === 0) return;
      setIndex((i) => (i + delta + len) % len);
      setProgress(0);
      startedAt.current = Date.now();
    },
    [len],
  );

  const next = useCallback(() => go(1), [go]);
  const prev = useCallback(() => go(-1), [go]);

  // Auto-advance + progress bar
  useEffect(() => {
    if (paused || len <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    startedAt.current = Date.now();
    setProgress(0);

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      setProgress(Math.min(100, (elapsed / INTERVAL_MS) * 100));
    }, 50);

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % len);
      setProgress(0);
      startedAt.current = Date.now();
    }, INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [paused, len, index]);

  // Keyboard + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'p' || e.key === 'P') {
        setPaused((p) => !p);
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, next, prev]);

  // Preload neighbors
  useEffect(() => {
    if (len < 2) return;
    const preload = (i: number) => {
      const img = new Image();
      img.src = pieces[i].file_url;
    };
    preload((index + 1) % len);
    preload((index - 1 + len) % len);
  }, [index, len, pieces]);

  if (!current || len === 0) return null;

  const artistName =
    current.profiles?.display_name ||
    (current as { profiles?: { display_name?: string } }).profiles?.display_name ||
    'Artist';

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next();
    else prev();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Art gallery"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{current.title}</p>
          <p className="truncate text-xs text-neutral-400">{artistName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress segments */}
      {len > 1 && (
        <div className="absolute inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-30 flex gap-1 px-4">
          {pieces.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-white transition-[width] duration-75 ease-linear"
                style={{
                  width:
                    i < index ? '100%' : i === index ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main image — click advances */}
      <button
        type="button"
        className="relative flex flex-1 items-center justify-center overflow-hidden focus:outline-none"
        onClick={next}
        aria-label="Next artwork"
      >
        <img
          key={current.id}
          src={current.file_url}
          alt={current.title}
          className="max-h-full max-w-full object-contain select-none gallery-fade"
          draggable={false}
        />
      </button>

      {/* Nav arrows (desktop) */}
      {len > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm hover:bg-black/70 sm:block"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm hover:bg-black/70 sm:block"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Bottom hint */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10 text-center">
        <p className="text-[11px] text-neutral-500">
          {index + 1} / {len}
          {len > 1 && (
            <span className="ml-2 text-neutral-600">
              · tap or swipe · {paused ? 'paused' : 'auto every 3s'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

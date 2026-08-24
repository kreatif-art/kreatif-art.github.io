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
      className="fixed inset-0 z-[70] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Art gallery"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Artwork fills the whole screen — no flex gap under the title */}
      <button
        type="button"
        className="absolute inset-0 flex items-center justify-center focus:outline-none"
        onClick={next}
        aria-label="Next artwork"
      >
        <img
          key={current.id}
          src={current.file_url}
          alt={current.title}
          className="h-full w-full object-contain select-none gallery-fade"
          draggable={false}
        />
      </button>

      {/* Compact top chrome overlaid on the image */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/75 via-black/35 to-transparent"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        {len > 1 && (
          <div className="flex gap-1 px-3 pt-2">
            {pieces.map((_, i) => (
              <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full bg-white transition-[width] duration-75 ease-linear"
                  style={{
                    width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>
        )}
        <div className="pointer-events-auto flex items-center gap-2 px-3 pb-3 pt-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight text-white">{current.title}</p>
            <p className="truncate text-[11px] leading-tight text-neutral-400">{artistName}</p>
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-full bg-white/15 p-2 text-white backdrop-blur-sm hover:bg-white/25"
            aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 p-2 text-white backdrop-blur-sm hover:bg-white/25"
            aria-label="Close gallery"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop arrows */}
      {len > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm hover:bg-black/60 sm:block"
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
            className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm hover:bg-black/60 sm:block"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Compact bottom counter overlaid */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/60 to-transparent px-3 pt-8 text-center"
        style={{ paddingBottom: 'max(0.5rem, var(--safe-bottom))' }}
      >
        <p className="text-[10px] text-neutral-400">
          {index + 1} / {len}
          {len > 1 && (
            <span className="text-neutral-500"> · tap or swipe · {paused ? 'paused' : '3s'}</span>
          )}
        </p>
      </div>
    </div>
  );
}

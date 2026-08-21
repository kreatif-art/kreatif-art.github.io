import { useCallback, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Music, Play } from 'lucide-react';
import type { ContentItem } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { cn, formatRelativeTime, formatNumber, formatDuration } from '@/lib/utils';

export function ContentCard({ item }: { item: ContentItem }) {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const isCurrent = currentTrack?.id === item.id;
  const isMusic = item.type === 'music';
  const isArt = item.type === 'art';

  const tiltRef = useRef<HTMLAnchorElement>(null);

  const handlePlay = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      play(item);
    }
  };

  /** Step C — art: 3D parallax tilt relative to cursor */
  const onArtMove = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    if (!isArt || !tiltRef.current) return;
    const el = tiltRef.current;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * 14;
    const rotX = (0.5 - py) * 14;
    el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
  }, [isArt]);

  const onArtLeave = useCallback(() => {
    if (!tiltRef.current) return;
    tiltRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }, []);

  const coverSrc = isMusic ? item.cover_image_url : item.file_url;

  return (
    <Link
      ref={tiltRef}
      to={`/content/${item.id}`}
      onMouseMove={isArt ? onArtMove : undefined}
      onMouseLeave={isArt ? onArtLeave : undefined}
      className={cn(
        'glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl',
        'border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
        'transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out',
        'hover:border-white/[0.14] hover:bg-white/[0.07] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
        isArt && 'will-change-transform [transform-style:preserve-3d]',
      )}
      style={isArt ? { transform: 'perspective(900px) rotateX(0) rotateY(0)' } : undefined}
    >
      {/* Media */}
      <div
        className={cn(
          'relative aspect-square overflow-hidden bg-neutral-900/60',
          isMusic && 'vinyl-stage',
        )}
      >
        {/* ---- Step D: music vinyl disc (sits behind sleeve, slides out on hover) ---- */}
        {isMusic && (
          <div className="vinyl-disc pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden>
            <div className="vinyl-disc-inner relative h-[78%] w-[78%] rounded-full bg-neutral-950 shadow-2xl">
              {/* grooves */}
              <div className="absolute inset-[8%] rounded-full border border-white/[0.06]" />
              <div className="absolute inset-[16%] rounded-full border border-white/[0.05]" />
              <div className="absolute inset-[24%] rounded-full border border-white/[0.04]" />
              <div className="absolute inset-[32%] rounded-full border border-white/[0.04]" />
              {/* label */}
              <div className="absolute inset-[34%] overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-orange-500/90 to-pink-600/90 shadow-inner">
                {coverSrc ? (
                  <img src={coverSrc} alt="" className="h-full w-full object-cover opacity-80" />
                ) : null}
              </div>
              <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900 ring-1 ring-white/20" />
            </div>
          </div>
        )}

        {/* Cover / sleeve (music: slides left on hover; art: standard image) */}
        <div
          className={cn(
            'relative z-10 h-full w-full',
            isMusic && 'vinyl-sleeve origin-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-[18%] group-hover:rotate-[-4deg]',
          )}
        >
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={item.title}
              loading="lazy"
              className={cn(
                'h-full w-full object-cover',
                isArt && 'transition-transform duration-500 ease-out group-hover:scale-[1.03]',
                isMusic && 'shadow-lg shadow-black/40',
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
              <Music className="h-10 w-10 text-neutral-600" />
            </div>
          )}

          {/* Sleeve edge highlight for music */}
          {isMusic && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/40 to-transparent" />
          )}
        </div>

        {/* Soft gradient veil */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
            isMusic
              ? 'bg-gradient-to-t from-orange-500/15 via-transparent to-transparent'
              : 'bg-gradient-to-t from-pink-500/15 via-transparent to-transparent',
          )}
        />

        {isMusic && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
            className={cn(
              'absolute bottom-3 right-3 z-30 flex h-11 w-11 items-center justify-center rounded-full',
              'bg-white/95 text-neutral-900 shadow-lg shadow-black/30 backdrop-blur-sm',
              'transition-all duration-300',
              isCurrent && isPlaying
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100',
            )}
          >
            {isCurrent && isPlaying ? (
              <span className="flex h-3.5 w-3.5 flex-col justify-between">
                <span className="h-1 w-full rounded-sm bg-neutral-900" />
                <span className="h-1 w-full rounded-sm bg-neutral-900" />
              </span>
            ) : (
              <Play className="h-5 w-5 translate-x-0.5" />
            )}
          </button>
        )}

        <div className="absolute left-3 top-3 z-30 flex flex-wrap gap-1">
          <div
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              'border border-white/10 bg-black/45 text-white/90 backdrop-blur-md',
            )}
          >
            {isMusic ? 'Music' : 'Art'}
          </div>
          {item.is_featured && (
            <div className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-100 backdrop-blur-md">
              Featured
            </div>
          )}
          {item.profiles?.is_pro && (
            <div className="rounded-full border border-orange-400/40 bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-100 backdrop-blur-md">
              Pro
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="relative z-10 flex flex-1 flex-col border-t border-white/[0.06] px-3.5 py-3">
        <h3 className="truncate text-sm font-medium tracking-tight text-white/95">{item.title}</h3>
        <p className="mt-0.5 truncate text-xs text-neutral-400">
          {item.profiles?.display_name || 'Unknown artist'}
        </p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-neutral-500">
            {isMusic && item.duration_sec ? (
              <span className="tabular-nums text-neutral-400">{formatDuration(item.duration_sec)}</span>
            ) : (
              formatRelativeTime(item.created_at)
            )}
            {isMusic && item.duration_sec ? (
              <span className="text-neutral-600"> · {formatRelativeTime(item.created_at)}</span>
            ) : null}
          </span>
          {item.like_count !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
              <Heart className="h-3 w-3" />
              {formatNumber(item.like_count)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

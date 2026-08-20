import { Link } from 'react-router-dom';
import { Heart, Music, Play } from 'lucide-react';
import type { ContentItem } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { formatNumber, formatRelativeTime, cn } from '@/lib/utils';

export function ContentCard({ item }: { item: ContentItem }) {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const isCurrent = currentTrack?.id === item.id;
  const isMusic = item.type === 'music';

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      play(item);
    }
  };

  const coverSrc = isMusic ? item.cover_image_url : item.file_url;

  return (
    <Link
      to={`/content/${item.id}`}
      className={cn(
        'glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl',
        'border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
        'transition-all duration-300',
        'hover:border-white/[0.14] hover:bg-white/[0.07] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
      )}
    >
      {/* Media */}
      <div className="relative aspect-square overflow-hidden bg-neutral-900/60">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
            <Music className="h-10 w-10 text-neutral-600" />
          </div>
        )}

        {/* Soft gradient veil for type equality */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
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
              'absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full',
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

        <div
          className={cn(
            'absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            'border border-white/10 bg-black/45 text-white/90 backdrop-blur-md',
          )}
        >
          {isMusic ? 'Music' : 'Art'}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col border-t border-white/[0.06] px-3.5 py-3">
        <h3 className="truncate text-sm font-medium tracking-tight text-white/95">{item.title}</h3>
        <p className="mt-0.5 truncate text-xs text-neutral-400">
          {item.profiles?.display_name || 'Unknown artist'}
        </p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">{formatRelativeTime(item.created_at)}</span>
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

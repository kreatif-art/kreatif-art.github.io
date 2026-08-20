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
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition-all hover:border-neutral-700 hover:shadow-lg hover:shadow-black/20"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-800">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-800">
            <Music className="h-10 w-10 text-neutral-600" />
          </div>
        )}

        {isMusic && (
          <button
            onClick={handlePlay}
            className={cn(
              'absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg transition-all',
              isCurrent && isPlaying
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100',
            )}
          >
            {isCurrent && isPlaying ? (
              <span className="flex h-3.5 w-3.5 flex-col justify-between">
                <span className="h-1 w-full bg-neutral-900" />
                <span className="h-1 w-full bg-neutral-900" />
              </span>
            ) : (
              <Play className="h-5 w-5 translate-x-0.5" />
            )}
          </button>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {isMusic ? 'Music' : 'Art'}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="truncate text-sm font-semibold text-white">{item.title}</h3>
        <p className="mt-0.5 truncate text-xs text-neutral-400">
          {item.profiles?.display_name || 'Unknown artist'}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-neutral-500">{formatRelativeTime(item.created_at)}</span>
          {item.like_count !== undefined && (
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <Heart className="h-3.5 w-3.5" />
              {formatNumber(item.like_count)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

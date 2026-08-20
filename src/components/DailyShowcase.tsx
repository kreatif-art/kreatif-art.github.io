import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Music } from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';
import type { ContentItem } from '@/types';

function pickDaily(items: ContentItem[], salt: number): ContentItem | null {
  if (!items.length) return null;
  const day = Math.floor(Date.now() / 86400000);
  const idx = Math.abs((day * 31 + salt) % items.length);
  return items[idx];
}

function Waveform({ active }: { active: boolean }) {
  const bars = 16;
  return (
    <div className="flex h-6 items-end justify-center gap-[2px]" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn('wave-bar w-[2px] rounded-full bg-orange-300/90', active && 'wave-bar--on')}
          style={{ animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </div>
  );
}

/**
 * Featured art of the day (large) + music of the day as a spinning CD disc.
 */
export function DailyShowcase() {
  const { items: musicItems, loading: musicLoading } = useContent({ type: 'music', pageSize: 20 });
  const { items: artItems, loading: artLoading } = useContent({ type: 'art', pageSize: 20 });
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const music = useMemo(() => pickDaily(musicItems, 7), [musicItems]);
  const art = useMemo(() => pickDaily(artItems, 13), [artItems]);

  const isDailyPlaying = !!(music && currentTrack?.id === music.id && isPlaying);
  const musicCover = music?.cover_image_url || music?.file_url;
  const artCover = art?.file_url;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!music) return;
    if (currentTrack?.id === music.id) togglePlay();
    else play(music);
  };

  if (musicLoading || artLoading) {
    return (
      <div className="flex h-[380px] items-center justify-center text-sm text-neutral-500">
        Loading today&apos;s picks…
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[33.6rem] mx-auto lg:max-w-none scale-100 lg:origin-top">
      <p className="label-caps mb-4 text-neutral-500">Today&apos;s picks</p>

      {/* Featured art */}
      {art ? (
        <Link
          to={`/content/${art.id}`}
          className="group relative block overflow-hidden rounded-2xl border border-white/[0.1] bg-neutral-900 shadow-[0_24px_50px_rgba(0,0,0,0.45)] origin-top scale-[1.2] sm:scale-[1.2]"
        >
          <div className="relative aspect-[4/5] w-full sm:aspect-[5/6]">
            {artCover ? (
              <img
                src={artCover}
                alt={art.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-neutral-900 text-neutral-600">
                Art
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <span className="label-caps text-pink-200/90">Art of the day</span>
              <h3 className="mt-2 text-xl font-medium tracking-tight text-white sm:text-2xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}>
                {art.title}
              </h3>
              <p className="mt-1 text-sm text-neutral-300">
                {art.profiles?.display_name || 'Kreatif'}
              </p>
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-white/10 text-sm text-neutral-500">
          No art pick today
        </div>
      )}

      {/* Spinning CD — music of the day, overlaps bottom-right of art */}
      {music && (
        <div className="absolute -bottom-2 right-0 z-10 sm:bottom-0 sm:-right-2">
          <div className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={handlePlay}
              className="group relative block h-28 w-28 sm:h-32 sm:w-32"
              aria-label={isDailyPlaying ? 'Pause music of the day' : 'Play music of the day'}
            >
              {/* disc */}
              <div
                className={cn(
                  'cd-disc absolute inset-0 rounded-full bg-neutral-950 shadow-[0_12px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/20',
                  isDailyPlaying && 'cd-disc--spinning',
                )}
              >
                {/* grooves */}
                <div className="absolute inset-[10%] rounded-full border border-white/[0.07]" />
                <div className="absolute inset-[18%] rounded-full border border-white/[0.06]" />
                <div className="absolute inset-[26%] rounded-full border border-white/[0.05]" />
                <div className="absolute inset-[34%] rounded-full border border-white/[0.04]" />
                {/* label */}
                <div className="absolute inset-[38%] overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-orange-500 to-pink-600 shadow-inner">
                  {musicCover ? (
                    <img src={musicCover} alt="" className="h-full w-full object-cover opacity-90" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Music className="h-4 w-4 text-white/80" />
                    </div>
                  )}
                </div>
                <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950 ring-1 ring-white/25" />
              </div>
              {/* play cue on hover when paused */}
              {!isDailyPlaying && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-lg">
                    <Play className="h-4 w-4 translate-x-0.5" />
                  </span>
                </span>
              )}
              {isDailyPlaying && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                    <Pause className="h-3.5 w-3.5" />
                  </span>
                </span>
              )}
            </button>

            <div className="mt-2 max-w-[9rem] text-center">
              <p className="label-caps text-[9px] text-orange-300/80">Music of the day</p>
              <Link to={`/content/${music.id}`} className="mt-0.5 block truncate text-xs font-medium text-white hover:underline">
                {music.title}
              </Link>
              <div className="mt-1.5 flex justify-center">
                <Waveform active={isDailyPlaying} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* spacer so CD doesn't collide with content below on mobile */}
      <div className="h-24 sm:h-28" />
    </div>
  );
}

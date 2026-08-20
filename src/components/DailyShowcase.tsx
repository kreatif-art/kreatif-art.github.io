import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Music, Image as ImageIcon } from 'lucide-react';
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
  const bars = 20;
  return (
    <div className="flex h-8 items-end justify-center gap-[2px]" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn('wave-bar w-[2.5px] rounded-full bg-white/90', active && 'wave-bar--on')}
          style={{ animationDelay: `${i * 0.045}s` }}
        />
      ))}
    </div>
  );
}

/**
 * Stacked, overlapping "of the day" cards — music + art at once.
 * Front card tilts; back card peeks. Play triggers waveform on the music card.
 */
export function DailyShowcase() {
  const { items: musicItems, loading: musicLoading } = useContent({ type: 'music', pageSize: 20 });
  const { items: artItems, loading: artLoading } = useContent({ type: 'art', pageSize: 20 });
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const music = useMemo(() => pickDaily(musicItems, 7), [musicItems]);
  const art = useMemo(() => pickDaily(artItems, 13), [artItems]);

  const isDailyPlaying = !!(music && currentTrack?.id === music.id && isPlaying);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!music) return;
    if (currentTrack?.id === music.id) togglePlay();
    else play(music);
  };

  const loading = musicLoading || artLoading;
  const musicCover = music?.cover_image_url || music?.file_url;
  const artCover = art?.file_url;

  if (loading) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-neutral-500">
        Loading today&apos;s picks…
      </div>
    );
  }

  if (!music && !art) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-neutral-500">
        No content yet for today&apos;s picks.
      </div>
    );
  }

  return (
    <div className="daily-stack relative mx-auto w-full max-w-[300px] select-none sm:max-w-[320px]">
      <p className="label-caps mb-5 text-center text-neutral-500">Today&apos;s picks</p>

      <div className="relative mx-auto aspect-[3/4] w-full">
        {/* Art card — back, offset */}
        {art && (
          <Link
            to={`/content/${art.id}`}
            className="daily-card daily-card--back group absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
            style={{
              transform: 'rotate(-7deg) translate(-10%, 6%) scale(0.94)',
            }}
          >
            <div className="relative h-full w-full bg-neutral-900">
              {artCover ? (
                <img
                  src={artCover}
                  alt={art.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-neutral-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pink-200/90 backdrop-blur-md">
                  Art of the day
                </span>
                <h3 className="mt-2 truncate text-sm font-medium text-white">{art.title}</h3>
                <p className="truncate text-xs text-neutral-400">
                  {art.profiles?.display_name || 'Kreatif'}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Music card — front */}
        {music && (
          <div
            className="daily-card daily-card--front absolute inset-0 overflow-hidden rounded-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
            style={{
              transform: 'rotate(4deg) translate(8%, -2%)',
            }}
          >
            <div className="relative flex h-full flex-col bg-neutral-950">
              <div className="relative min-h-0 flex-1 overflow-hidden">
                {musicCover ? (
                  <img src={musicCover} alt={music.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-neutral-900">
                    <Music className="h-10 w-10 text-neutral-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 transition-opacity duration-500',
                    isDailyPlaying ? 'opacity-100' : 'opacity-0',
                  )}
                  style={{
                    background:
                      'radial-gradient(ellipse at 50% 80%, rgba(251,146,60,0.25), transparent 60%)',
                  }}
                />

                <div className="absolute inset-x-0 bottom-0 p-4 pt-12">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-200/90 backdrop-blur-md">
                    Music of the day
                  </span>
                  <Link to={`/content/${music.id}`} className="mt-2 block">
                    <h3 className="truncate text-base font-medium text-white hover:underline">
                      {music.title}
                    </h3>
                    <p className="truncate text-xs text-neutral-400">
                      {music.profiles?.display_name || 'Kreatif'}
                    </p>
                  </Link>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePlay}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
                      aria-label={isDailyPlaying ? 'Pause' : 'Play'}
                    >
                      {isDailyPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 translate-x-0.5" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <Waveform active={isDailyPlaying} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-[11px] text-neutral-600">
        Hover the back card to lift it · Play for soundwaves
      </p>
    </div>
  );
}

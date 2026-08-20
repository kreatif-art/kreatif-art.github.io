import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Image as ImageIcon, Music } from 'lucide-react';
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
  const bars = 24;
  return (
    <div className="flex h-10 items-end justify-center gap-[3px]" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn('wave-bar w-[3px] rounded-full bg-orange-400/90', active && 'wave-bar--on')}
          style={{
            animationDelay: `${i * 0.04}s`,
            height: active ? undefined : '20%',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Flip-book style panel: Music of the day / Art of the day.
 * Play triggers global player + waveform animation.
 */
export function DailyShowcase() {
  const { items: musicItems, loading: musicLoading } = useContent({ type: 'music', pageSize: 20 });
  const { items: artItems, loading: artLoading } = useContent({ type: 'art', pageSize: 20 });
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const music = useMemo(() => pickDaily(musicItems, 7), [musicItems]);
  const art = useMemo(() => pickDaily(artItems, 13), [artItems]);

  const [face, setFace] = useState<'music' | 'art'>('music');
  const [flipping, setFlipping] = useState(false);
  const autoRef = useRef<number | null>(null);

  const flip = (to?: 'music' | 'art') => {
    if (flipping) return;
    setFlipping(true);
    setTimeout(() => {
      setFace((f) => to ?? (f === 'music' ? 'art' : 'music'));
      setFlipping(false);
    }, 320);
  };

  // Gentle auto-flip every 8s when not playing music of the day
  useEffect(() => {
    autoRef.current = window.setInterval(() => {
      const playingDaily =
        isPlaying && music && currentTrack?.id === music.id;
      if (!playingDaily) flip();
    }, 8000);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [isPlaying, currentTrack, music]);

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

  return (
    <div className="relative w-full max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="label-caps text-neutral-500">Of the day</p>
        <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
          <button
            type="button"
            onClick={() => flip('music')}
            className={cn(
              'rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors',
              face === 'music' ? 'bg-white/15 text-white' : 'text-neutral-500 hover:text-neutral-300',
            )}
          >
            Music
          </button>
          <button
            type="button"
            onClick={() => flip('art')}
            className={cn(
              'rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors',
              face === 'art' ? 'bg-white/15 text-white' : 'text-neutral-500 hover:text-neutral-300',
            )}
          >
            Art
          </button>
        </div>
      </div>

      <div className={cn('flip-book', flipping && 'flip-book--flip')}>
        <div className="flip-book-inner glass-card overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {loading ? (
            <div className="flex aspect-[4/5] items-center justify-center text-sm text-neutral-500">
              Loading…
            </div>
          ) : face === 'music' && music ? (
            <div className="flex flex-col">
              <div className="relative aspect-square overflow-hidden bg-neutral-900">
                {musicCover ? (
                  <img src={musicCover} alt={music.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Music className="h-12 w-12 text-neutral-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={handlePlay}
                  className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg transition-transform hover:scale-105"
                  aria-label={isDailyPlaying ? 'Pause' : 'Play'}
                >
                  {isDailyPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
                </button>
                <div className="absolute bottom-4 right-4 left-20">
                  <Waveform active={isDailyPlaying} />
                </div>
              </div>
              <Link to={`/content/${music.id}`} className="block p-4 transition-colors hover:bg-white/[0.03]">
                <p className="label-caps mb-1 text-orange-400/80">Music of the day</p>
                <h3 className="truncate text-base font-medium text-white">{music.title}</h3>
                <p className="mt-0.5 truncate text-sm text-neutral-400">
                  {music.profiles?.display_name || 'Kreatif'}
                </p>
              </Link>
            </div>
          ) : face === 'art' && art ? (
            <div className="flex flex-col">
              <Link to={`/content/${art.id}`} className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
                {artCover ? (
                  <img
                    src={artCover}
                    alt={art.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-neutral-600" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-16">
                  <p className="label-caps mb-1 text-pink-300/80">Art of the day</p>
                  <h3 className="truncate text-base font-medium text-white">{art.title}</h3>
                  <p className="mt-0.5 truncate text-sm text-neutral-300">
                    {art.profiles?.display_name || 'Kreatif'}
                  </p>
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center p-6 text-center text-sm text-neutral-500">
              No content yet for today’s picks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

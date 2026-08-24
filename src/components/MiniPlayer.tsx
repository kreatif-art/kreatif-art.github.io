import { Play, Pause, X, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlayer } from '@/context/PlayerContext';
import { AudioBars } from '@/components/AudioBars';
import { formatDuration, cn } from '@/lib/utils';

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, seek, volume, setVolume, stop, currentTime, duration } = usePlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mini-player fixed left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-900 transition-transform hover:scale-105"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
        </button>

        <Link to={`/content/${currentTrack.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-800">
            {currentTrack.cover_image_url || currentTrack.type === 'art' ? (
              <img
                src={currentTrack.type === 'art' ? currentTrack.file_url : currentTrack.cover_image_url || ''}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-600">
                <Play className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{currentTrack.title}</p>
            <p className="truncate text-xs text-neutral-400">
              {currentTrack.profiles?.display_name || 'Unknown artist'}
            </p>
          </div>
        </Link>

        <AudioBars className="hidden sm:block" bars={20} height={26} />

        <div className="hidden flex-1 items-center gap-3 sm:flex">
          <span className="text-xs tabular-nums text-neutral-400">{formatDuration(currentTime)}</span>
          <div
            className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-neutral-800"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-pink-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-neutral-400">{formatDuration(duration)}</span>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="text-neutral-400 hover:text-neutral-200"
          >
            {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className={cn('h-1 w-20 cursor-pointer accent-orange-500')}
          />
        </div>

        <button onClick={stop} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

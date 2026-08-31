import { Link } from 'react-router-dom';
import { Link2, Music, Image as ImageIcon, X } from 'lucide-react';
import type { ContentPair, ContentItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { deletePair } from '@/hooks/usePairs';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/context/PlayerContext';

type Props = {
  pairs: ContentPair[];
  /** The content page we're on */
  currentType: 'music' | 'art';
  onChanged?: () => void;
  className?: string;
};

function otherWork(pair: ContentPair, currentType: 'music' | 'art'): ContentItem | undefined {
  return currentType === 'music' ? pair.art : pair.music;
}

export function PairPanel({ pairs, currentType, onChanged, className }: Props) {
  const { user } = useAuth();
  const player = usePlayer();

  if (!pairs.length) return null;

  const handleUnpair = async (id: string) => {
    if (!confirm('Remove this Sound & Sight pair?')) return;
    await deletePair(id);
    onChanged?.();
  };

  return (
    <section className={cn('mt-10', className)}>
      <div className="mb-4 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-orange-300/90" />
        <h2 className="text-lg font-medium text-white">Sound &amp; Sight pairs</h2>
      </div>
      <ul className="space-y-3">
        {pairs.map((pair) => {
          const other = otherWork(pair, currentType);
          if (!other) return null;
          const isMusicOther = other.type === 'music';
          const cover = isMusicOther
            ? other.cover_image_url || other.file_url
            : other.file_url;
          const canRemove = user && (user.id === pair.created_by);

          return (
            <li
              key={pair.id}
              className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm"
            >
              <Link
                to={`/content/${other.id}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-900"
              >
                {cover ? (
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-600">
                    {isMusicOther ? <Music className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                  {pair.kind === 'curated' ? 'Curated pair' : pair.kind === 'editorial' ? 'Editorial' : 'Artist pair'}
                  {pair.creator?.display_name ? ` · ${pair.creator.display_name}` : ''}
                </p>
                <Link to={`/content/${other.id}`} className="mt-0.5 block truncate text-sm font-medium text-white hover:text-orange-200">
                  {other.title}
                </Link>
                {pair.note && (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{pair.note}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {isMusicOther && (
                    <button
                      type="button"
                      onClick={() => player.play(other)}
                      className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-neutral-200 hover:bg-white/10"
                    >
                      Play with this view
                    </button>
                  )}
                  <Link
                    to={`/pair/${pair.id}`}
                    className="rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-[11px] text-orange-100 hover:bg-orange-500/20"
                  >
                    Open pair
                  </Link>
                  <Link
                    to={`/content/${other.id}`}
                    className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-neutral-200 hover:bg-white/10"
                  >
                    Open {isMusicOther ? 'track' : 'artwork'}
                  </Link>
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => handleUnpair(pair.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-500/20 px-2 py-1 text-[11px] text-red-300/90 hover:bg-red-500/10"
                    >
                      <X className="h-3 w-3" /> Unpair
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

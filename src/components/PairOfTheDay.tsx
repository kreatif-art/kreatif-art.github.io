import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Music, Image as ImageIcon, Share2 } from 'lucide-react';
import { useFeaturedPairs } from '@/hooks/usePairs';
import { usePlayer } from '@/context/PlayerContext';
import { setShareMeta } from '@/lib/shareMeta';
import type { ContentPair } from '@/types';
import { cn } from '@/lib/utils';

function pickPairOfDay(pairs: ContentPair[]): ContentPair | null {
  if (!pairs.length) return null;
  const day = Math.floor(Date.now() / 86400000);
  return pairs[Math.abs(day * 17) % pairs.length];
}

export function PairOfTheDay() {
  const { pairs, loading } = useFeaturedPairs(24);
  const pair = useMemo(() => pickPairOfDay(pairs), [pairs]);
  const { play } = usePlayer();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pair?.music || !pair?.art) return;
    setShareMeta({
      title: `Pair of the Day — ${pair.music.title} × ${pair.art.title} | Kreatif`,
      description: pair.note || 'Sound and sight, paired on purpose on Kreatif.',
      url: `https://kreatif-art.github.io/pair/${pair.id}`,
      image: pair.art.file_url || pair.music.cover_image_url,
    });
  }, [pair]);

  const share = async () => {
    if (!pair) return;
    const url = `${window.location.origin}/pair/${pair.id}`;
    const text = `Pair of the Day on Kreatif: ${pair.music?.title} × ${pair.art?.title}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, url, text });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !pair?.music || !pair?.art) return null;

  const musicCover = pair.music.cover_image_url || pair.music.file_url;
  const artCover = pair.art.file_url;

  return (
    <section className="border-b border-white/[0.06] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-caps mb-1 text-orange-400/80">Today</p>
            <h2
              className="text-2xl text-white sm:text-3xl"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
            >
              Pair of the Day
            </h2>
            <p className="mt-1 text-xs text-neutral-500">One track. One artwork. Share the dual moment.</p>
          </div>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-neutral-200 hover:border-orange-400/40 hover:bg-orange-500/10"
          >
            <Share2 className="h-3.5 w-3.5" />
            {copied ? 'Link copied' : 'Share pair'}
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="grid md:grid-cols-2">
            <Link to={`/content/${pair.music.id}`} className="group relative min-h-[220px] bg-neutral-900 md:min-h-[280px]">
              {musicCover ? (
                <img src={musicCover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.02]" />
              ) : (
                <div className="flex h-full min-h-[220px] items-center justify-center text-neutral-600">
                  <Music className="h-10 w-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="label-caps text-orange-300/90">Sound</span>
                <p className="mt-1 text-lg font-medium text-white">{pair.music.title}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    play(pair.music!);
                  }}
                  className="mt-3 rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-neutral-900 hover:bg-white"
                >
                  Play track
                </button>
              </div>
            </Link>

            <Link to={`/content/${pair.art.id}`} className="group relative min-h-[220px] bg-neutral-900 md:min-h-[280px]">
              {artCover ? (
                <img src={artCover} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              ) : (
                <div className="flex h-full min-h-[220px] items-center justify-center text-neutral-600">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="label-caps text-pink-300/90">Sight</span>
                <p className="mt-1 text-lg font-medium text-white">{pair.art.title}</p>
                <span className="mt-3 inline-block text-xs text-neutral-300">Open artwork</span>
              </div>
            </Link>
          </div>
          {pair.note && (
            <p className="border-t border-white/[0.06] px-5 py-4 text-center text-sm italic text-neutral-400">
              “{pair.note}”
            </p>
          )}
          <div className="flex justify-center border-t border-white/[0.06] px-5 py-3">
            <Link
              to={`/pair/${pair.id}`}
              className={cn('inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300')}
            >
              <Link2 className="h-3.5 w-3.5" />
              Open pair page
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Link2, Music, Image as ImageIcon, Share2, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/context/PlayerContext';
import { setShareMeta, resetShareMeta } from '@/lib/shareMeta';
import { ShareButton } from '@/components/ShareButton';
import { AddToCollectionButton } from '@/components/AddToCollectionButton';
import { LoadingState, ErrorState } from '@/components/States';
import type { ContentPair, ContentItem } from '@/types';

const CONTENT_SELECT =
  'id, user_id, type, title, description, file_url, cover_image_url, duration_sec, visibility, profiles!inner(id, display_name, avatar_url)';

export function PairPage() {
  const { id } = useParams<{ id: string }>();
  const [pair, setPair] = useState<ContentPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { play } = usePlayer();

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('content_pairs')
        .select(
          `id, music_id, art_id, created_by, kind, note, status, created_at,
           music:content!music_id (${CONTENT_SELECT}),
           art:content!art_id (${CONTENT_SELECT})`,
        )
        .eq('id', id)
        .eq('status', 'visible')
        .maybeSingle();
      setLoading(false);
      if (err || !data) {
        setError('Pair not found');
        setPair(null);
        return;
      }
      const p = data as unknown as ContentPair;
      setPair(p);
      setShareMeta({
        title: `${p.music?.title} × ${p.art?.title} — Kreatif Pair`,
        description: p.note || 'Sound and sight paired on Kreatif.',
        url: `https://kreatif-art.github.io/pair/${p.id}`,
        image: p.art?.file_url || p.music?.cover_image_url,
      });
    })();
    return () => resetShareMeta();
  }, [id]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    }
  };

  if (loading) return <LoadingState className="min-h-screen" />;
  if (error || !pair?.music || !pair?.art) {
    return <ErrorState message={error || 'Pair not found'} />;
  }

  const music = pair.music as ContentItem;
  const art = pair.art as ContentItem;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="label-caps mb-2 text-orange-400/80">
          <Link2 className="mr-1 inline h-3 w-3" /> Sound &amp; Sight pair
        </p>
        <h1
          className="text-3xl text-white sm:text-4xl"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
        >
          {music.title} <span className="text-neutral-500">×</span> {art.title}
        </h1>
        {pair.note && <p className="mt-3 max-w-xl text-sm italic text-neutral-400">“{pair.note}”</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="relative aspect-square bg-neutral-900">
              {(music.cover_image_url || music.file_url) && (
                <img src={music.cover_image_url || music.file_url} alt="" className="h-full w-full object-cover" />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-orange-200">
                Sound
              </span>
            </div>
            <div className="p-4">
              <Link to={`/content/${music.id}`} className="font-medium text-white hover:underline">
                {music.title}
              </Link>
              <p className="text-xs text-neutral-500">
                {(music as ContentItem & { profiles?: { display_name?: string } }).profiles?.display_name}
              </p>
              <button
                type="button"
                onClick={() => play(music)}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-neutral-900"
              >
                <Play className="h-3.5 w-3.5" /> Play
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="relative aspect-square bg-neutral-900">
              {art.file_url && <img src={art.file_url} alt="" className="h-full w-full object-cover" />}
              <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-pink-200">
                Sight
              </span>
            </div>
            <div className="p-4">
              <Link to={`/content/${art.id}`} className="font-medium text-white hover:underline">
                {art.title}
              </Link>
              <p className="text-xs text-neutral-500">
                {(art as ContentItem & { profiles?: { display_name?: string } }).profiles?.display_name}
              </p>
              <Link
                to={`/content/${art.id}`}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-neutral-200"
              >
                <ImageIcon className="h-3.5 w-3.5" /> View art
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <AddToCollectionButton pairId={pair.id} />
          <ShareButton
            title={`${music.title} × ${art.title} — Kreatif Pair`}
            text={pair.note || 'Sound and sight paired on Kreatif'}
            label="Share this pair"
          />
          <Link to="/" className="rounded-full px-5 py-2.5 text-sm text-neutral-500 hover:text-neutral-300">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link2, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { createArtistPair, createCuratedPair } from '@/hooks/usePairs';
import type { ContentItem } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  /** Content on the current page */
  item: ContentItem;
  onPaired?: () => void;
  className?: string;
};

export function PairWithButton({ item, onPaired, className }: Props) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'artist' | 'curated'>('artist');

  const isOwner = user && item.user_id === user.id;
  const needType = item.type === 'music' ? 'art' : 'music';

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      setLoading(true);
      setError(null);
      // Artist mode: only own works of the other type
      // Curated: any visible works of the other type (limit)
      let q = supabase
        .from('content')
        .select(
          'id, user_id, type, title, description, file_url, cover_image_url, visibility, created_at, profiles!inner(id, display_name)',
        )
        .eq('type', needType)
        .eq('visibility', 'visible')
        .order('created_at', { ascending: false })
        .limit(40);

      if (mode === 'artist') {
        q = q.eq('user_id', user.id);
      }

      const { data, error: err } = await q;
      setLoading(false);
      if (err) {
        setError(err.message);
        setCandidates([]);
        return;
      }
      setCandidates((data || []) as unknown as ContentItem[]);
    })();
  }, [open, user, needType, mode]);

  if (!user) return null;

  // Only show if owner (artist pair) — curated available to any logged-in user
  // Always show button for logged-in users

  const submit = async () => {
    if (!selectedId || !user) return;
    setBusy(true);
    setError(null);
    const musicId = item.type === 'music' ? item.id : selectedId;
    const artId = item.type === 'art' ? item.id : selectedId;
    const fn = mode === 'artist' ? createArtistPair : createCuratedPair;
    const { error: err } = await fn({
      musicId,
      artId,
      userId: user.id,
      note: note.trim() || undefined,
    });
    setBusy(false);
    if (err) {
      setError(err.message.includes('duplicate') || err.code === '23505'
        ? 'This pair already exists.'
        : err.message);
      return;
    }
    setOpen(false);
    setSelectedId(null);
    setNote('');
    onPaired?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMode(isOwner ? 'artist' : 'curated');
          setOpen(true);
        }}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-neutral-200 hover:border-orange-400/40 hover:bg-orange-500/10 hover:text-orange-100',
          className,
        )}
      >
        <Link2 className="h-3.5 w-3.5" />
        Pair with {needType === 'art' ? 'art' : 'music'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950 p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-neutral-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="pr-8 text-lg font-medium text-white">
              Pair “{item.title}” with {needType}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Create a <span className="text-neutral-300">Sound &amp; Sight</span> unit fans can open and share as one link.
              Use your own works, or curate across the catalog. Add a short note so the pairing feels intentional.
            </p>

            {isOwner && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('artist')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs',
                    mode === 'artist' ? 'bg-white text-neutral-900' : 'border border-white/15 text-neutral-400',
                  )}
                >
                  My works
                </button>
                <button
                  type="button"
                  onClick={() => setMode('curated')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs',
                    mode === 'curated' ? 'bg-white text-neutral-900' : 'border border-white/15 text-neutral-400',
                  )}
                >
                  Curate any
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
              </div>
            ) : candidates.length === 0 ? (
              <p className="mt-6 text-sm text-neutral-400">
                {mode === 'artist'
                  ? `Upload some ${needType} first to create an artist pair.`
                  : `No ${needType} found.`}
              </p>
            ) : (
              <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto">
                {candidates.map((c) => {
                  const thumb = c.type === 'music' ? c.cover_image_url || c.file_url : c.file_url;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-2 py-2 text-left transition-colors',
                          selectedId === c.id
                            ? 'border-orange-400/40 bg-orange-500/10'
                            : 'border-white/10 hover:bg-white/[0.04]',
                        )}
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
                          {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{c.title}</p>
                          <p className="truncate text-[11px] text-neutral-500">
                            {(c.profiles as { display_name?: string })?.display_name}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <label className="mt-4 block text-xs text-neutral-500">
              Note (optional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                placeholder="Late-night pulse meets neon geometry…"
                rows={2}
                placeholder="Why these two belong together…"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </label>

            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

            <button
              type="button"
              disabled={!selectedId || busy}
              onClick={submit}
              className="mt-4 w-full rounded-full bg-white py-2.5 text-sm font-medium text-neutral-900 disabled:opacity-40"
            >
              {busy ? 'Saving…' : 'Create pair'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

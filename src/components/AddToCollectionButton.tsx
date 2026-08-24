import { useEffect, useState } from 'react';
import { ListPlus, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMyPlaylists, createPlaylist, addPlaylistItem } from '@/hooks/usePlaylists';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Props = {
  contentId?: string;
  pairId?: string;
  className?: string;
};

export function AddToCollectionButton({ contentId, pairId, className }: Props) {
  const { user, profile } = useAuth();
  const { playlists, loading, refetch } = useMyPlaylists(user?.id);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Lock body scroll when sheet open (mobile)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        to="/login"
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300',
          className,
        )}
      >
        <ListPlus className="h-3.5 w-3.5" /> Save
      </Link>
    );
  }

  const addTo = async (playlistId: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await addPlaylistItem({ playlistId, contentId, pairId });
      setMsg('Added to collection');
      await refetch();
      setTimeout(() => setOpen(false), 700);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Could not add');
    }
    setBusy(false);
  };

  const createAndAdd = async () => {
    if (!newTitle.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const id = await createPlaylist({ title: newTitle.trim(), visibility: 'private' });
      await addPlaylistItem({ playlistId: id, contentId, pairId });
      setMsg('Created & added');
      setNewTitle('');
      await refetch();
      setTimeout(() => setOpen(false), 700);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Could not create');
    }
    setBusy(false);
  };

  const isPro = !!(profile?.is_pro && (!profile.pro_until || new Date(profile.pro_until) > new Date()));
  const canCreate = isPro || playlists.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setMsg(null);
        }}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300 hover:border-white/30 hover:text-white',
          className,
        )}
      >
        <ListPlus className="h-3.5 w-3.5" />
        Save
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Save to collection"
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />

          {/* Centered sheet — works on mobile & desktop */}
          <div
            className="relative z-[101] flex max-h-[min(85dvh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-lg font-medium text-white">Save to collection</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-neutral-500 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-3 text-xs text-neutral-500">
                Free: 1 collection (25 items). Pro: unlimited.
                {!isPro && playlists.length >= 1 && (
                  <Link to="/pro" className="ml-1 text-orange-300/90 hover:underline">
                    Go Pro
                  </Link>
                )}
              </p>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                </div>
              ) : (
                <ul className="space-y-1">
                  {playlists.map((pl) => (
                    <li key={pl.id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => addTo(pl.id)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-neutral-200 hover:bg-white/5 disabled:opacity-50"
                      >
                        <span className="font-medium">{pl.title}</span>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-600">
                          {pl.visibility}
                        </span>
                      </button>
                    </li>
                  ))}
                  {playlists.length === 0 && (
                    <li className="px-2 py-6 text-center text-sm text-neutral-500">
                      No collections yet — create one below.
                    </li>
                  )}
                </ul>
              )}
            </div>

            {canCreate && (
              <div className="shrink-0 border-t border-white/10 px-5 py-4">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-600">New collection</p>
                <div className="flex gap-2">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Name"
                    className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600"
                    maxLength={120}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void createAndAdd();
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={busy || !newTitle.trim()}
                    onClick={() => void createAndAdd()}
                    className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                  </button>
                </div>
              </div>
            )}

            {!canCreate && (
              <div className="shrink-0 border-t border-white/10 px-5 py-3 text-center text-xs text-neutral-500">
                Free plan limit reached.{' '}
                <Link to="/pro" className="text-orange-300 hover:underline">
                  Upgrade for more collections
                </Link>
              </div>
            )}

            {msg && (
              <p className="shrink-0 px-5 pb-2 text-center text-xs text-neutral-400">{msg}</p>
            )}

            <Link
              to="/collections"
              className="shrink-0 border-t border-white/10 py-3 text-center text-xs text-neutral-500 hover:text-neutral-300"
              onClick={() => setOpen(false)}
            >
              Manage collections
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

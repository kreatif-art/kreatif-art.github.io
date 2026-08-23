import { useState } from 'react';
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

  if (!user) {
    return (
      <Link
        to="/login"
        className={cn('inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300', className)}
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
      setTimeout(() => setOpen(false), 800);
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
      setTimeout(() => setOpen(false), 800);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Could not create');
    }
    setBusy(false);
  };

  const isPro = !!(profile?.is_pro && (!profile.pro_until || new Date(profile.pro_until) > new Date()));

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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Save to collection</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-xs text-neutral-500">
              Free: 1 collection (25 items). Pro: unlimited collections.
              {!isPro && playlists.length >= 1 && (
                <Link to="/pro" className="ml-1 text-orange-300/90 hover:underline">
                  Go Pro
                </Link>
              )}
            </p>

            {loading ? (
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-500" />
            ) : (
              <ul className="mb-4 max-h-48 space-y-1 overflow-y-auto">
                {playlists.map((pl) => (
                  <li key={pl.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => addTo(pl.id)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-neutral-200 hover:bg-white/5 disabled:opacity-50"
                    >
                      <span>{pl.title}</span>
                      <span className="text-[10px] uppercase text-neutral-600">{pl.visibility}</span>
                    </button>
                  </li>
                ))}
                {playlists.length === 0 && (
                  <li className="px-2 py-3 text-center text-sm text-neutral-500">No collections yet</li>
                )}
              </ul>
            )}

            {(isPro || playlists.length === 0) && (
              <div className="flex gap-2 border-t border-white/10 pt-4">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New collection name"
                  className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600"
                  maxLength={120}
                />
                <button
                  type="button"
                  disabled={busy || !newTitle.trim()}
                  onClick={createAndAdd}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            )}

            {msg && <p className="mt-3 text-xs text-neutral-400">{msg}</p>}
            <Link to="/collections" className="mt-3 block text-center text-xs text-neutral-500 hover:text-neutral-300">
              Manage collections
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

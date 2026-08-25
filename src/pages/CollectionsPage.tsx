import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListMusic, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMyPlaylists, createPlaylist } from '@/hooks/usePlaylists';
import { LoadingState } from '@/components/States';
import type { PlaylistVisibility } from '@/types';

export function CollectionsPage() {
  const { user, profile } = useAuth();
  const { playlists, loading, refetch } = useMyPlaylists(user?.id);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<PlaylistVisibility>('private');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isPro = !!(profile?.is_pro && (!profile.pro_until || new Date(profile.pro_until) > new Date()));

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await createPlaylist({ title: title.trim(), visibility });
      setTitle('');
      await refetch();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Could not create');
    }
    setBusy(false);
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl text-white">Collections</h1>
        <p className="mt-2 text-sm text-neutral-400">Sign in to curate music, art, and pairs.</p>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-white px-5 py-2 text-sm font-medium text-neutral-900">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 sm:py-12 sm:pb-14">
      <p className="label-caps mb-1 text-orange-400/80">Your library</p>
      <h1
        className="text-3xl text-white sm:text-4xl"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
      >
        Collections
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Curate tracks, artworks, and Sound &amp; Sight pairs.
        {isPro ? ' Pro: unlimited collections.' : ' Free: 1 collection · 25 items.'}{' '}
        {!isPro && (
          <Link to="/pro" className="text-orange-300/90 hover:underline">
            Upgrade
          </Link>
        )}
      </p>

      {/* Create form — sticky on mobile so it never sits under the bottom nav */}
      <form
        onSubmit={onCreate}
        className="sticky top-0 z-10 mt-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-neutral-950/95 p-4 shadow-lg backdrop-blur-md sm:static sm:bg-white/[0.03] sm:shadow-none sm:backdrop-blur-none"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New collection title"
          className="min-w-[12rem] flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white"
          maxLength={120}
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as PlaylistVisibility)}
          className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-300"
        >
          <option value="private">Private</option>
          <option value="unlisted">Unlisted</option>
          <option value="public">Public</option>
        </select>
        <button
          type="submit"
          disabled={busy || !title.trim() || (!isPro && playlists.length >= 1)}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create
        </button>
        {!isPro && playlists.length >= 1 && (
          <p className="w-full text-xs text-neutral-500">Free plan limit reached. Go Pro for more collections.</p>
        )}
        {err && <p className="w-full text-xs text-red-400">{err}</p>}
      </form>

      {loading ? (
        <LoadingState className="mt-10" />
      ) : playlists.length === 0 ? (
        <div className="mt-12 text-center text-sm text-neutral-500">
          <ListMusic className="mx-auto mb-3 h-10 w-10 opacity-40" />
          No collections yet. Create one or hit <span className="text-neutral-400">Save</span> on any work.
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {playlists.map((pl) => (
            <li key={pl.id}>
              <Link
                to={`/collections/${pl.id}`}
                className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-4 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div>
                  <p className="font-medium text-white">{pl.title}</p>
                  {pl.description && <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">{pl.description}</p>}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-600">{pl.visibility}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

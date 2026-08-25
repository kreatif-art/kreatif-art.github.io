import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Image as ImageIcon, Link2, Trash2, Share2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlaylist, removePlaylistItem, updatePlaylist, deletePlaylist } from '@/hooks/usePlaylists';
import { usePlayer } from '@/context/PlayerContext';
import { LoadingState, ErrorState } from '@/components/States';
import { ArtGallery } from '@/components/ArtGallery';
import type { ContentItem, PlaylistVisibility } from '@/types';

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { playlist, items, loading, error, refetch } = usePlaylist(id);
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);
  const autoOpened = useRef(false);
  const isOwner = !!(user && playlist && user.id === playlist.user_id);

  const musicTracks = items
    .map((it) => it.content)
    .filter((c): c is NonNullable<typeof c> => !!c && c.type === 'music' && !!c.file_url);

  const artPieces = items
    .map((it) => it.content)
    .filter((c): c is ContentItem => !!c && c.type === 'art' && !!c.file_url);

  // Art-only collection → open foyer automatically once items are ready
  const isArtFoyer = artPieces.length > 0 && musicTracks.length === 0;

  useEffect(() => {
    if (loading || autoOpened.current) return;
    if (isArtFoyer) {
      autoOpened.current = true;
      setGalleryStart(0);
      setGalleryOpen(true);
    }
  }, [loading, isArtFoyer, id]);

  // Reset auto-open flag when navigating to another collection
  useEffect(() => {
    autoOpened.current = false;
  }, [id]);

  const playAll = () => {
    if (musicTracks.length) playQueue(musicTracks, 0, true);
  };

  const playFrom = (contentId: string) => {
    const idx = musicTracks.findIndex((m) => m.id === contentId);
    if (idx >= 0) playQueue(musicTracks, idx, true);
  };

  const openGallery = (contentId?: string) => {
    if (!artPieces.length) return;
    const idx = contentId ? artPieces.findIndex((a) => a.id === contentId) : 0;
    setGalleryStart(idx >= 0 ? idx : 0);
    setGalleryOpen(true);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: playlist?.title, url });
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

  const onVisibility = async (v: PlaylistVisibility) => {
    if (!id) return;
    await updatePlaylist(id, { visibility: v });
    await refetch();
  };

  const onDelete = async () => {
    if (!id || !confirm('Delete this collection?')) return;
    await deletePlaylist(id);
    navigate('/collections');
  };

  if (loading) return <LoadingState className="min-h-screen" />;
  if (error || !playlist) return <ErrorState message={error || 'Not found'} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 sm:py-12 sm:pb-14">
      <Link to="/collections" className="mb-6 inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300">
        <ArrowLeft className="h-3.5 w-3.5" /> Collections
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-1 text-orange-400/80">{playlist.visibility}</p>
          <h1
            className="text-3xl text-white sm:text-4xl"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
          >
            {playlist.title}
          </h1>
          {playlist.description && <p className="mt-2 text-sm text-neutral-400">{playlist.description}</p>}
          <p className="mt-2 text-xs text-neutral-600">
            {items.length} items
            {artPieces.length > 0 && ` · ${artPieces.length} art`}
            {musicTracks.length > 0 && ` · ${musicTracks.length} music`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {musicTracks.length > 0 && (
              <button
                type="button"
                onClick={playAll}
                className="rounded-full bg-white px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-200"
              >
                Play all music · loops
              </button>
            )}
            {artPieces.length > 0 && (
              <button
                type="button"
                onClick={() => openGallery()}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-200"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Enter foyer · 3s
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(playlist.visibility !== 'private' || isOwner) && (
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-neutral-300"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Share'}
            </button>
          )}
          {isOwner && (
            <>
              <select
                value={playlist.visibility}
                onChange={(e) => onVisibility(e.target.value as PlaylistVisibility)}
                className="rounded-full border border-white/15 bg-transparent px-3 py-2 text-xs text-neutral-300"
              >
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
              <button type="button" onClick={onDelete} className="rounded-full border border-red-500/30 px-3 py-2 text-xs text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Art foyer grid — visual entry to the gallery */}
      {artPieces.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">Art foyer</p>
            <button
              type="button"
              onClick={() => openGallery()}
              className="text-[11px] text-orange-300/90 hover:underline"
            >
              Slideshow · 3s each
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {artPieces.map((piece, i) => (
              <button
                key={piece.id}
                type="button"
                onClick={() => openGallery(piece.id)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-neutral-900 text-left focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <img
                  src={piece.file_url}
                  alt={piece.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading={i < 4 ? 'eager' : 'lazy'}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pb-2.5 pt-8">
                  <p className="truncate text-xs font-medium text-white">{piece.title}</p>
                  <p className="truncate text-[10px] text-neutral-400">
                    {piece.profiles?.display_name || 'Artist'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Music + pairs list (and any non-grid items) */}
      {(musicTracks.length > 0 || items.some((it) => it.pair)) && (
        <ul className="mt-10 space-y-2">
          {items.map((it) => {
            if (it.content && it.content.type === 'music') {
              const c = it.content;
              const cover = c.cover_image_url;
              return (
                <li key={it.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <Link to={`/content/${c.id}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
                    {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/content/${c.id}`} className="truncate text-sm font-medium text-white hover:underline">
                      {c.title}
                    </Link>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600">Sound</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => playFrom(c.id)}
                    className="rounded-full bg-white/90 px-3 py-1 text-xs text-neutral-900"
                  >
                    {currentTrack?.id === c.id && isPlaying ? 'Playing' : 'Play'}
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={async () => {
                        await removePlaylistItem(it.id);
                        await refetch();
                      }}
                      className="text-neutral-600 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            }
            if (it.pair) {
              const p = it.pair;
              return (
                <li key={it.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <Link to={`/pair/${p.id}`} className="flex h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                    <div className="w-1/2 bg-neutral-900">
                      {p.music?.cover_image_url && (
                        <img src={p.music.cover_image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="w-1/2 bg-neutral-900">
                      {p.art?.file_url && <img src={p.art.file_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/pair/${p.id}`} className="truncate text-sm font-medium text-white hover:underline">
                      {p.music?.title} × {p.art?.title}
                    </Link>
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-600">
                      <Link2 className="h-3 w-3" /> Pair
                    </p>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={async () => {
                        await removePlaylistItem(it.id);
                        await refetch();
                      }}
                      className="text-neutral-600 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            }
            return null;
          })}
        </ul>
      )}

      {/* Manage art list (remove) for owners when art-only — compact under grid */}
      {isOwner && artPieces.length > 0 && (
        <div className="mt-8 border-t border-white/5 pt-6">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-600">Manage pieces</p>
          <ul className="space-y-1">
            {items
              .filter((it) => it.content?.type === 'art')
              .map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2 py-1.5 text-sm text-neutral-400">
                  <span className="truncate">{it.content?.title}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await removePlaylistItem(it.id);
                      await refetch();
                    }}
                    className="shrink-0 text-neutral-600 hover:text-red-400"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      {items.length === 0 && (
        <p className="mt-12 text-center text-sm text-neutral-500">
          Empty collection. Use <span className="text-neutral-400">Save</span> on content or pairs.
        </p>
      )}

      {galleryOpen && artPieces.length > 0 && (
        <ArtGallery
          pieces={artPieces}
          startIndex={galleryStart}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}

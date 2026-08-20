import { useState, useEffect, useCallback, useRef, type TouchEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Flag, ArrowLeft, Play, Pause, Music, Share2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { ImageLightbox } from '@/components/ImageLightbox';
import { LoadingState, ErrorState } from '@/components/States';
import { ContentCard } from '@/components/ContentCard';
import { useContent } from '@/hooks/useContent';
import type { ContentItem, Profile } from '@/types';
import { formatRelativeTime, formatDuration, formatNumber, getInitials, cn } from '@/lib/utils';
import { REPORT_REASONS } from '@/types';

export function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const isMusic = item?.type === 'music';
  const isCurrent = currentTrack?.id === item?.id;

  const { items: moreItems } = useContent({
    type: item?.type,
    pageSize: 6,
  userId: undefined,
  genreId: undefined,
    search: undefined,
  });

  const fetchContent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('content')
      .select(
        'id, user_id, type, title, description, genre_id, file_url, cover_image_url, duration_sec, visibility, created_at, updated_at, profiles!inner(id, display_name, avatar_url, bio, is_artist, email), genre:genres(id, name, type, sort_order)',
      )
      .eq('id', id)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setError('Content not found or has been removed.');
      setLoading(false);
      return;
    }

    const contentItem = data as unknown as ContentItem;
    setItem(contentItem);

    // Fetch like count
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', id);
    setLikeCount(count || 0);

    // Check if current user liked this
    if (user) {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('content_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      setIsLiked(!!existingLike);
    }

    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Adjacent pieces of the same type (for swipe navigation)
  useEffect(() => {
    if (!item) {
      setPrevId(null);
      setNextId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('content')
        .select('id')
        .eq('type', item.type)
        .eq('visibility', 'visible')
        .order('created_at', { ascending: false })
        .limit(80);
      if (cancelled || !data?.length) return;
      const ids = data.map((r) => r.id as string);
      const idx = ids.indexOf(item.id);
      if (idx === -1) return;
      setPrevId(idx > 0 ? ids[idx - 1] : null);
      setNextId(idx < ids.length - 1 ? ids[idx + 1] : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [item]);


  const handleLike = async () => {
    if (!user || !item) return;
    if (isLiked) {
      const { error } = await supabase.from('likes').delete().eq('content_id', item.id).eq('user_id', user.id);
      if (!error) {
        setIsLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await supabase.from('likes').insert({ content_id: item.id, user_id: user.id });
      if (!error) {
        setIsLiked(true);
        setLikeCount((c) => c + 1);
      }
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !item || !reportReason) return;
    setReportSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      content_id: item.id,
      reason: reportReason,
    });
    setReportSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setReportSuccess(true);
      setShowReport(false);
      setReportReason('');
    }
  };

  const handlePlay = () => {
    if (!item) return;
    if (isCurrent) {
      togglePlay();
    } else {
      play(item);
    }
  };

  if (loading) return <LoadingState className="min-h-screen" />;
  if (error) return <ErrorState message={error} onRetry={() => navigate(-1)} />;
  if (!item) return <ErrorState message="Content not found" />;

  const artist = item.profiles as unknown as Profile;
  const moreFromArtist = moreItems.filter((m) => m.user_id !== item.user_id).slice(0, 4);

  const goPrev = () => { if (prevId) navigate(`/content/${prevId}`); };
  const goNext = () => { if (nextId) navigate(`/content/${nextId}`); };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    swipeRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!swipeRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeRef.current.x;
    const dy = touch.clientY - swipeRef.current.y;
    swipeRef.current = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    // Swipe left → next; swipe right → previous
    if (dx < 0) goNext();
    else goPrev();
  };

  return (
    <div
      className="min-h-screen bg-neutral-950 pb-24 touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to={isMusic ? '/browse/music' : '/browse/art'} className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200">
            <ArrowLeft className="h-4 w-4" /> Back to {isMusic ? 'Music' : 'Art'}
          </Link>
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
            Swipe for next {isMusic ? 'track' : 'piece'}
          </p>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={!prevId}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-white disabled:opacity-30"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!nextId}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-white disabled:opacity-30"
          >
            Next →
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Media */}
          <div>
            {isMusic ? (
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-900">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music className="h-16 w-16 text-neutral-700" />
                  </div>
                )}
                <button
                  onClick={handlePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-900">
                    {isCurrent && isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 translate-x-0.5" />}
                  </span>
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-neutral-900">
                <img
                  src={item.file_url}
                  alt={item.title}
                  className="w-full cursor-zoom-in object-contain"
                  onClick={() => setShowLightbox(true)}
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
                {isMusic ? 'Music' : 'Art'}
              </span>
              {item.genre && (
                <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
                  {item.genre.name}
                </span>
              )}
              <span className="text-xs text-neutral-500">{formatRelativeTime(item.created_at)}</span>
            </div>

            <h1 className="text-2xl font-bold text-white sm:text-3xl">{item.title}</h1>

            <Link to={`/artist/${artist.id}`} className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-neutral-800">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-neutral-300">{getInitials(artist.display_name)}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-200">{artist.display_name}</p>
                <p className="text-xs text-neutral-500">View profile</p>
              </div>
            </Link>

            {item.description && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-300">{item.description}</p>
            )}

            {isMusic && item.duration_sec && (
              <p className="mt-2 text-xs text-neutral-500">{formatDuration(item.duration_sec)}</p>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleLike}
                disabled={!user}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  isLiked
                    ? 'border-red-900/50 bg-red-950/20 text-red-300'
                    : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800',
                  !user && 'cursor-not-allowed opacity-50',
                )}
              >
                <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
                {formatNumber(likeCount)} {likeCount === 1 ? 'Like' : 'Likes'}
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: item.title, url: window.location.href });
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                  }
                }}
                className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>

              {user && (
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  <Flag className="h-4 w-4" /> Report
                </button>
              )}
            </div>

            {!user && (
              <p className="mt-3 text-xs text-neutral-500">
                <Link to="/login" className="text-orange-400 hover:text-orange-300">Sign in</Link> to like and report content.
              </p>
            )}

            {reportSuccess && (
              <p className="mt-3 rounded-lg border border-green-900/50 bg-green-950/20 px-4 py-2 text-sm text-green-300">
                Report submitted. Thank you — our team will review it.
              </p>
            )}
          </div>
        </div>

        {/* More from other artists */}
        {moreFromArtist.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-bold text-white">More to explore</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {moreFromArtist.map((m) => (
                <ContentCard key={m.id} item={m} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowReport(false)}>
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Report content</h3>
              <button onClick={() => setShowReport(false)} className="text-neutral-400 hover:text-neutral-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleReport} className="space-y-3">
              <p className="text-sm text-neutral-400">Why are you reporting this?</p>
              {REPORT_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="accent-orange-500"
                  />
                  {reason}
                </label>
              ))}
              <button
                type="submit"
                disabled={!reportReason || reportSubmitting}
                className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit report'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox for art */}
      {showLightbox && !isMusic && (
        <ImageLightbox src={item.file_url} alt={item.title} onClose={() => setShowLightbox(false)} />
      )}
    </div>
  );
}

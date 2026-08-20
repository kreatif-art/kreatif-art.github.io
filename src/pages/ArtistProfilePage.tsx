import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useContent } from '@/hooks/useContent';
import { ContentCard } from '@/components/ContentCard';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { getInitials, formatNumber, cn } from '@/lib/utils';
import { Music, Image, UserPlus, UserCheck, Heart, Edit3 } from 'lucide-react';
import type { Profile } from '@/types';

export function ArtistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile: ownProfile } = useAuth();
  const [artist, setArtist] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'music' | 'art'>('music');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  const { items: musicItems, loading: musicLoading } = useContent({ type: 'music', userId: id });
  const { items: artItems, loading: artLoading } = useContent({ type: 'art', userId: id });

  const fetchArtistData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (profileError || !data) {
      setError('Artist not found.');
      setLoading(false);
      return;
    }

    setArtist(data as Profile);

    // Subscriber count
    const { count: subCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed_to', id);
    setSubscriberCount(subCount || 0);

    // Check subscription
    if (user) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber', user.id)
        .eq('subscribed_to', id)
        .maybeSingle();
      setIsSubscribed(!!sub);
    }

    // Total likes across all content
    const { data: contentIds } = await supabase
      .from('content')
      .select('id')
      .eq('user_id', id);
    
    if (contentIds && contentIds.length > 0) {
      const ids = contentIds.map((c) => c.id);
      const { count: likeCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('content_id', ids);
      setTotalLikes(likeCount || 0);
    }

    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetchArtistData();
  }, [fetchArtistData]);

  const handleSubscribe = async () => {
    if (!user || !id) return;
    if (isSubscribed) {
      const { error } = await supabase.from('subscriptions').delete().eq('subscriber', user.id).eq('subscribed_to', id);
      if (!error) {
        setIsSubscribed(false);
        setSubscriberCount((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await supabase.from('subscriptions').insert({ subscriber: user.id, subscribed_to: id });
      if (!error) {
        setIsSubscribed(true);
        setSubscriberCount((c) => c + 1);
      }
    }
  };

  if (loading) return <LoadingState className="min-h-screen" />;
  if (error) return <ErrorState message={error} />;
  if (!artist) return <ErrorState message="Artist not found" />;

  const isOwnProfile = user?.id === id;
  const items = tab === 'music' ? musicItems : artItems;
  const itemsLoading = tab === 'music' ? musicLoading : artLoading;

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      {/* Banner */}
      <div className="h-40 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Profile header */}
        <div className="-mt-16 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-neutral-950 bg-neutral-800">
            {artist.avatar_url ? (
              <img src={artist.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-neutral-300">{getInitials(artist.display_name)}</span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{artist.display_name}</h1>
            {artist.is_artist && (
              <span className="mt-1 inline-block rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-400">
                Artist
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {isOwnProfile ? (
              <Link to="/profile" className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800">
                <Edit3 className="h-4 w-4" /> Edit profile
              </Link>
            ) : user ? (
              <button
                onClick={handleSubscribe}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
                  isSubscribed
                    ? 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90',
                )}
              >
                {isSubscribed ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 flex justify-center gap-6 sm:justify-start">
          <div className="text-center sm:text-left">
            <p className="text-lg font-bold text-white">{formatNumber(subscriberCount)}</p>
            <p className="text-xs text-neutral-500">Subscribers</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-lg font-bold text-white">{formatNumber(totalLikes)}</p>
            <p className="text-xs text-neutral-500">Total likes</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-lg font-bold text-white">{formatNumber(musicItems.length + artItems.length)}</p>
            <p className="text-xs text-neutral-500">Uploads</p>
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400">{artist.bio}</p>
        )}

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-neutral-800">
          <button
            onClick={() => setTab('music')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === 'music' ? 'border-orange-500 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200',
            )}
          >
            <Music className="h-4 w-4" /> Music ({musicItems.length})
          </button>
          <button
            onClick={() => setTab('art')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === 'art' ? 'border-pink-500 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200',
            )}
          >
            <Image className="h-4 w-4" /> Art ({artItems.length})
          </button>
        </div>

        {/* Content grid */}
        <div className="mt-6">
          {itemsLoading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <EmptyState title={`No ${tab} yet`} message={isOwnProfile ? 'Upload your first piece to get started.' : 'This artist hasn\'t uploaded any ' + tab + ' yet.'} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

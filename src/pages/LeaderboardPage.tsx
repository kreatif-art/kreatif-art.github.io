import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LoadingState, EmptyState } from '@/components/States';
import { getInitials, formatNumber, cn } from '@/lib/utils';
import { Trophy, Music, Image, Crown } from 'lucide-react';
import type { Profile } from '@/types';

interface LeaderEntry {
  profile: Profile;
  totalLikes: number;
  contentCount: number;
}

export function LeaderboardPage() {
  const [tab, setTab] = useState<'music' | 'art'>('music');
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async (type: 'music' | 'art') => {
    setLoading(true);

    // Get all content of this type with like counts
    const { data: contentData } = await supabase
      .from('content')
      .select('id, user_id, visibility')
      .eq('type', type)
      .eq('visibility', 'visible');

    if (!contentData || contentData.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const contentIds = contentData.map((c) => c.id);
    const { data: likesData } = await supabase
      .from('likes')
      .select('content_id')
      .in('content_id', contentIds);

    // Count likes per content
    const likesPerContent = new Map<string, number>();
    for (const like of likesData || []) {
      likesPerContent.set(like.content_id, (likesPerContent.get(like.content_id) || 0) + 1);
    }

    // Aggregate by user
    const userStats = new Map<string, { totalLikes: number; contentCount: number }>();
    for (const content of contentData) {
      const likes = likesPerContent.get(content.id) || 0;
      const existing = userStats.get(content.user_id) || { totalLikes: 0, contentCount: 0 };
      existing.totalLikes += likes;
      existing.contentCount += 1;
      userStats.set(content.user_id, existing);
    }

    // Get profiles for top users
    const userIds = Array.from(userStats.keys());
    if (userIds.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    // Build and sort entries
    const leaderboard: LeaderEntry[] = (profilesData || [])
      .map((p) => {
        const stats = userStats.get((p as Profile).id);
        return {
          profile: p as Profile,
          totalLikes: stats?.totalLikes || 0,
          contentCount: stats?.contentCount || 0,
        };
      })
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 10);

    setEntries(leaderboard);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard(tab);
  }, [tab, fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Top 10 Leaderboard</h1>
          <p className="mt-1 text-sm text-neutral-400">The most-loved artists on Kreatif, ranked by total likes</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
          <button
            onClick={() => setTab('music')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
              tab === 'music' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            <Music className="h-4 w-4" /> Music Artists
          </button>
          <button
            onClick={() => setTab('art')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
              tab === 'art' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            <Image className="h-4 w-4" /> Art Artists
          </button>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <LoadingState />
        ) : entries.length === 0 ? (
          <EmptyState title="No rankings yet" message={`No ${tab} artists have received likes yet. Be the first!`} />
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <Link
                key={entry.profile.id}
                to={`/artist/${entry.profile.id}`}
                className="group flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-all hover:border-neutral-700 hover:bg-neutral-900/80"
              >
                {/* Rank */}
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  i === 1 ? 'bg-neutral-400/20 text-neutral-300' :
                  i === 2 ? 'bg-orange-700/20 text-orange-500' :
                  'bg-neutral-800 text-neutral-400',
                )}>
                  {i < 3 ? <Crown className="h-4 w-4" /> : i + 1}
                </div>

                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800">
                  {entry.profile.avatar_url ? (
                    <img src={entry.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-neutral-300">{getInitials(entry.profile.display_name)}</span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white group-hover:text-orange-400">{entry.profile.display_name}</p>
                  <p className="text-xs text-neutral-500">{entry.contentCount} upload{entry.contentCount !== 1 ? 's' : ''}</p>
                </div>

                {/* Likes */}
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{formatNumber(entry.totalLikes)}</p>
                  <p className="text-xs text-neutral-500">like{entry.totalLikes !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

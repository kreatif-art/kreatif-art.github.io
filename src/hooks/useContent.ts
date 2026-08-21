import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ContentItem, Genre } from '@/types';
import { PAGE_SIZE } from '@/types';

export function useGenres(type?: 'music' | 'art') {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase.from('genres').select('*').order('sort_order');
    if (type) query = query.eq('type', type);
    query.then(({ data, error }) => {
      if (!error && data) setGenres(data as Genre[]);
      setLoading(false);
    });
  }, [type]);

  return { genres, loading };
}

interface UseContentOptions {
  type?: 'music' | 'art';
  genreId?: string | null;
  search?: string;
  /** title = work name; artist = creator display name */
  searchScope?: 'title' | 'artist';
  userId?: string;
  pageSize?: number;
}

export function useContent({
  type,
  genreId,
  search,
  searchScope = 'title',
  userId,
  pageSize = PAGE_SIZE,
}: UseContentOptions = {}) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('content')
        .select(
          'id, user_id, type, title, description, genre_id, file_url, cover_image_url, duration_sec, visibility, created_at, updated_at, profiles!inner(id, display_name, avatar_url, bio, is_artist, email), genre:genres(id, name, type, sort_order)',
          { count: 'exact' },
        )
        .eq('visibility', 'visible')
        .order('created_at', { ascending: false })
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

      if (type) query = query.eq('type', type);
      if (genreId) query = query.eq('genre_id', genreId);
      if (userId) query = query.eq('user_id', userId);
      if (search && search.trim()) {
        const q = search.trim();
        if (searchScope === 'artist') {
          query = query.ilike('profiles.display_name', `%${q}%`);
        } else {
          query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
        }
      }

      const { data, error: queryError, count } = await query;

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      if (count !== null) setTotal(count);

      const contentItems = (data || []) as unknown as ContentItem[];

      if (contentItems.length > 0) {
        const contentIds = contentItems.map((item) => item.id);
        const { data: likesData } = await supabase
          .from('likes')
          .select('content_id')
          .in('content_id', contentIds);

        const likeCounts = new Map<string, number>();
        for (const like of likesData || []) {
          likeCounts.set(like.content_id, (likeCounts.get(like.content_id) || 0) + 1);
        }

        contentItems.forEach((item) => {
          item.like_count = likeCounts.get(item.id) || 0;
        });
      }

      setHasMore(contentItems.length === pageSize);
      setItems((prev) => (replace ? contentItems : [...prev, ...contentItems]));
      setLoading(false);
    },
    [type, genreId, search, searchScope, userId, pageSize],
  );

  useEffect(() => {
    setPage(0);
    fetchPage(0, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPage(nextPage, false);
    }
  }, [loading, hasMore, page, fetchPage]);

  return { items, loading, error, hasMore, total, loadMore, refetch: () => fetchPage(0, true) };
}

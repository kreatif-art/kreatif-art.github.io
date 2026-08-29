import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ContentItem } from '@/types';
import { loadOfflineCatalog } from '@/lib/offlineCache';

async function attachLikeCounts(items: ContentItem[]): Promise<ContentItem[]> {
  if (!items.length) return items;
  const ids = items.map((i) => i.id);
  const { data: likes } = await supabase.from('likes').select('content_id').in('content_id', ids);
  const map = new Map<string, number>();
  for (const row of likes || []) {
    map.set(row.content_id, (map.get(row.content_id) || 0) + 1);
  }
  return items.map((item) => ({ ...item, like_count: map.get(item.id) || 0 }));
}

const SELECT =
  'id, user_id, type, title, description, genre_id, file_url, cover_image_url, duration_sec, visibility, is_featured, featured_until, created_at, updated_at, profiles!inner(id, display_name, avatar_url, bio, is_artist, is_pro, pro_until)';

/** Newest visible works (last ~14 days preferred, else latest overall) */
export function useNewThisWeek(limit = 12) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 14);

      let { data, error } = await supabase
        .from('content')
        .select(SELECT)
        .eq('visibility', 'visible')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data?.length) {
        const fallback = await supabase
          .from('content')
          .select(SELECT)
          .eq('visibility', 'visible')
          .order('created_at', { ascending: false })
          .limit(limit);
        data = fallback.data;
        error = fallback.error;
      }

      if (cancelled) return;
      if (error || !data) {
        const offline = loadOfflineCatalog()?.slice(0, limit) || [];
        setItems(offline as ContentItem[]);
        setLoading(false);
        return;
      }
      const withLikes = await attachLikeCounts(data as unknown as ContentItem[]);
      if (!cancelled) {
        setItems(withLikes);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { items, loading };
}

/** Rising: highest like counts among recent visible works */
export function useRising(limit = 12) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 45);

      const { data, error } = await supabase
        .from('content')
        .select(SELECT)
        .eq('visibility', 'visible')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(48);

      if (cancelled) return;
      if (error || !data?.length) {
        const offline = loadOfflineCatalog()?.slice(0, limit) || [];
        setItems(offline as ContentItem[]);
        setLoading(false);
        return;
      }

      const withLikes = await attachLikeCounts(data as unknown as ContentItem[]);
      withLikes.sort((a, b) => (b.like_count || 0) - (a.like_count || 0) || +new Date(b.created_at) - +new Date(a.created_at));
      const rising = withLikes.filter((i) => (i.like_count || 0) > 0).slice(0, limit);
      // If nothing has likes yet, still show recent as a soft rising shelf
      setItems(rising.length ? rising : withLikes.slice(0, limit));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { items, loading };
}

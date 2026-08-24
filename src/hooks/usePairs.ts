import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ContentPair, ContentItem } from '@/types';
import { saveOfflineCatalog } from '@/lib/offlineCache';

const CONTENT_SELECT =
  'id, user_id, type, title, description, genre_id, file_url, cover_image_url, duration_sec, visibility, is_featured, created_at, profiles!inner(id, display_name, avatar_url, is_artist, is_pro), genre:genres(id, name, type)';

function one<T>(v: T | T[] | null | undefined): T | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function mapPair(row: Record<string, unknown>): ContentPair {
  return {
    id: row.id as string,
    music_id: row.music_id as string,
    art_id: row.art_id as string,
    created_by: row.created_by as string,
    kind: row.kind as ContentPair['kind'],
    note: (row.note as string) || null,
    status: row.status as ContentPair['status'],
    created_at: row.created_at as string,
    music: one(row.music as ContentItem | ContentItem[] | undefined),
    art: one(row.art as ContentItem | ContentItem[] | undefined),
    creator: one(row.creator as ContentPair['creator'] | ContentPair['creator'][] | undefined),
  };
}

export function usePairsForContent(contentId: string | undefined, type: 'music' | 'art' | undefined) {
  const [pairs, setPairs] = useState<ContentPair[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!contentId || !type) {
      setPairs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const col = type === 'music' ? 'music_id' : 'art_id';
    const { data, error } = await supabase
      .from('content_pairs')
      .select(
        `
        id, music_id, art_id, created_by, kind, note, status, created_at,
        music:content!music_id (${CONTENT_SELECT}),
        art:content!art_id (${CONTENT_SELECT}),
        creator:profiles!created_by (id, display_name, avatar_url, is_artist, is_pro)
      `,
      )
      .eq(col, contentId)
      .eq('status', 'visible')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setPairs([]);
    } else {
      const mapped = (data || []).map((r) => mapPair(r as Record<string, unknown>));
        // Prefer visual diversity: one pair per art piece
        const seenArt = new Set<string>();
        const unique: typeof mapped = [];
        for (const p of mapped) {
          if (seenArt.has(p.art_id)) continue;
          seenArt.add(p.art_id);
          unique.push(p);
        }
        setPairs(unique);
        if (unique.length) saveOfflineCatalog({ pairs: unique });
    }
    setLoading(false);
  }, [contentId, type]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { pairs, loading, refetch };
}

export function useFeaturedPairs(limit = 6) {
  const [pairs, setPairs] = useState<ContentPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_pairs')
        .select(
          `
          id, music_id, art_id, created_by, kind, note, status, created_at,
          music:content!music_id (${CONTENT_SELECT}),
          art:content!art_id (${CONTENT_SELECT}),
          creator:profiles!created_by (id, display_name, avatar_url, is_artist, is_pro)
        `,
        )
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
        .limit(Math.max(limit * 4, 24));
      if (error) {
        console.error(error);
        setPairs([]);
      } else {
        const mapped = (data || []).map((r) => mapPair(r as Record<string, unknown>));
        const seenArt = new Set<string>();
        const seenMus = new Set<string>();
        const unique: ContentPair[] = [];
        for (const p of mapped) {
          if (seenArt.has(p.art_id) || seenMus.has(p.music_id)) continue;
          seenArt.add(p.art_id);
          seenMus.add(p.music_id);
          unique.push(p);
        }
        setPairs(unique);
        if (unique.length) saveOfflineCatalog({ pairs: unique });
      }
      setLoading(false);
    })();
  }, [limit]);

  return { pairs, loading };
}

export async function createArtistPair(opts: {
  musicId: string;
  artId: string;
  userId: string;
  note?: string;
}) {
  const { data, error } = await supabase
    .from('content_pairs')
    .insert({
      music_id: opts.musicId,
      art_id: opts.artId,
      created_by: opts.userId,
      kind: 'artist',
      note: opts.note?.trim() || null,
      status: 'visible',
    })
    .select('id')
    .single();
  return { data, error };
}

export async function createCuratedPair(opts: {
  musicId: string;
  artId: string;
  userId: string;
  note?: string;
}) {
  const { data, error } = await supabase
    .from('content_pairs')
    .insert({
      music_id: opts.musicId,
      art_id: opts.artId,
      created_by: opts.userId,
      kind: 'curated',
      note: opts.note?.trim() || null,
      status: 'visible',
    })
    .select('id')
    .single();
  return { data, error };
}

export async function deletePair(pairId: string) {
  return supabase.from('content_pairs').delete().eq('id', pairId);
}

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Playlist, PlaylistItem, PlaylistVisibility } from '@/types';

const CONTENT_SELECT =
  'id, user_id, type, title, description, file_url, cover_image_url, duration_sec, visibility, profiles!inner(id, display_name, avatar_url)';

export function useMyPlaylists(userId?: string | null) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setPlaylists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) {
      console.error(error);
      setPlaylists([]);
    } else {
      setPlaylists((data || []) as Playlist[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { playlists, loading, refetch };
}

export function usePlaylist(id?: string) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data: pl, error: e1 } = await supabase
      .from('playlists')
      .select('*, profiles:user_id (id, display_name, avatar_url, is_pro)')
      .eq('id', id)
      .maybeSingle();
    if (e1 || !pl) {
      setError('Collection not found');
      setPlaylist(null);
      setItems([]);
      setLoading(false);
      return;
    }
    setPlaylist(pl as unknown as Playlist);

    const { data: rows, error: e2 } = await supabase
      .from('playlist_items')
      .select(
        `
        id, playlist_id, content_id, pair_id, position, added_at,
        content:content_id (${CONTENT_SELECT}),
        pair:pair_id (
          id, music_id, art_id, note, kind,
          music:content!music_id (${CONTENT_SELECT}),
          art:content!art_id (${CONTENT_SELECT})
        )
      `,
      )
      .eq('playlist_id', id)
      .order('position', { ascending: true });
    if (e2) {
      console.error(e2);
      setItems([]);
    } else {
      setItems((rows || []) as unknown as PlaylistItem[]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { playlist, items, loading, error, refetch };
}

export async function createPlaylist(opts: {
  title: string;
  description?: string;
  visibility?: PlaylistVisibility;
}) {
  const { data, error } = await supabase.rpc('create_playlist', {
    p_title: opts.title,
    p_description: opts.description ?? null,
    p_visibility: opts.visibility ?? 'private',
  });
  if (error) {
    const msg = error.message || error.details || 'Could not create collection';
    throw new Error(msg);
  }
  if (!data) throw new Error('Could not create collection');
  return data as string;
}

export async function addPlaylistItem(opts: {
  playlistId: string;
  contentId?: string;
  pairId?: string;
}) {
  const { data, error } = await supabase.rpc('add_playlist_item', {
    p_playlist_id: opts.playlistId,
    p_content_id: opts.contentId ?? null,
    p_pair_id: opts.pairId ?? null,
  });
  if (error) {
    throw new Error(error.message || error.details || 'Could not add to collection');
  }
  return data as string;
}

export async function removePlaylistItem(itemId: string) {
  const { error } = await supabase.from('playlist_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function updatePlaylist(
  id: string,
  patch: Partial<Pick<Playlist, 'title' | 'description' | 'visibility'>>,
) {
  const { error } = await supabase.from('playlists').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deletePlaylist(id: string) {
  const { error } = await supabase.from('playlists').delete().eq('id', id);
  if (error) throw error;
}

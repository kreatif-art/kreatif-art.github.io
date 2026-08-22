-- Sound & Sight content pairs (see live DB for full RLS)
CREATE TABLE IF NOT EXISTS public.content_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  music_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  art_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'artist',
  note text,
  status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (music_id, art_id)
);

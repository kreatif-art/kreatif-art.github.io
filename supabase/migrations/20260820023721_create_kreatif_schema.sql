/*
# Kreatif Platform Schema — Initial Migration

## Overview
Creates the complete database schema for Kreatif, a platform where artists and musicians
upload original music and art, and fans discover, like, and subscribe to creators.

## New Tables
1. `profiles` — extends auth.users with display name, avatar, bio, artist mode toggle
2. `genres` — fixed list of music and art genres
3. `content` — uploaded music tracks and art pieces with visibility control
4. `likes` — one like per user per content item
5. `subscriptions` — fan subscribes to artist
6. `originality_attestations` — immutable legal attestation of originality
7. `reports` — user-submitted content reports for moderation

## Security (RLS)
- profiles: public read, update own
- genres: public read
- content: public read visible, owner CRUD, admin full access
- likes: public read, insert/delete own
- subscriptions: public read, insert/delete own
- originality_attestations: read/insert own (immutable)
- reports: insert own, admin read/update

## Storage
- avatars, content-media, cover-images buckets (public)

## Notes
- Admin = email 'admin@kreatif.app'. Sign up with that email for admin access.
- Content visibility column allows hiding without deletion.
- Owner columns default to auth.uid() for seamless frontend inserts.
*/

-- ============================================================
-- TABLES (all created first, before functions/policies)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text DEFAULT '',
  is_artist boolean NOT NULL DEFAULT false,
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('music', 'art')),
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('music', 'art')),
  title text NOT NULL,
  description text DEFAULT '',
  genre_id uuid REFERENCES genres(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  cover_image_url text,
  duration_sec int,
  visibility text NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  subscribed_to uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscriber, subscribed_to)
);

CREATE TABLE IF NOT EXISTS originality_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  attested_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- ============================================================
-- FUNCTIONS (after tables exist)
-- ============================================================

CREATE OR REPLACE FUNCTION get_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND email = 'admin@kreatif.app'
  );
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS content_updated_at ON content;
CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS ENABLE + POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are visible to everyone" ON profiles;
CREATE POLICY "Public profiles are visible to everyone"
  ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Genres are publicly readable" ON genres;
CREATE POLICY "Genres are publicly readable"
  ON genres FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read visible content" ON content;
CREATE POLICY "Public can read visible content"
  ON content FOR SELECT TO anon, authenticated USING (visibility = 'visible');
DROP POLICY IF EXISTS "Owners can read their own hidden content" ON content;
CREATE POLICY "Owners can read their own hidden content"
  ON content FOR SELECT TO authenticated USING (visibility = 'hidden' AND user_id = auth.uid());
DROP POLICY IF EXISTS "Admin can read all content" ON content;
CREATE POLICY "Admin can read all content"
  ON content FOR SELECT TO authenticated USING (get_is_admin());
DROP POLICY IF EXISTS "Authenticated users can insert content" ON content;
CREATE POLICY "Authenticated users can insert content"
  ON content FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners can update their own content" ON content;
CREATE POLICY "Owners can update their own content"
  ON content FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin can update any content" ON content;
CREATE POLICY "Admin can update any content"
  ON content FOR UPDATE TO authenticated USING (get_is_admin()) WITH CHECK (get_is_admin());
DROP POLICY IF EXISTS "Owners can delete their own content" ON content;
CREATE POLICY "Owners can delete their own content"
  ON content FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin can delete any content" ON content;
CREATE POLICY "Admin can delete any content"
  ON content FOR DELETE TO authenticated USING (get_is_admin());

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Likes are publicly readable" ON likes;
CREATE POLICY "Likes are publicly readable"
  ON likes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
CREATE POLICY "Users can insert their own likes"
  ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Subscriptions are publicly readable" ON subscriptions;
CREATE POLICY "Subscriptions are publicly readable"
  ON subscriptions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = subscriber);
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON subscriptions;
CREATE POLICY "Users can delete their own subscriptions"
  ON subscriptions FOR DELETE TO authenticated USING (auth.uid() = subscriber);

ALTER TABLE originality_attestations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own attestations" ON originality_attestations;
CREATE POLICY "Users can read their own attestations"
  ON originality_attestations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own attestations" ON originality_attestations;
CREATE POLICY "Users can insert their own attestations"
  ON originality_attestations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert reports" ON reports;
CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Admin can read all reports" ON reports;
CREATE POLICY "Admin can read all reports"
  ON reports FOR SELECT TO authenticated USING (get_is_admin());
DROP POLICY IF EXISTS "Admin can update reports" ON reports;
CREATE POLICY "Admin can update reports"
  ON reports FOR UPDATE TO authenticated USING (get_is_admin()) WITH CHECK (get_is_admin());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_genre_id ON content (genre_id);
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content (user_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content (type);
CREATE INDEX IF NOT EXISTS idx_content_visibility ON content (visibility);
CREATE INDEX IF NOT EXISTS idx_likes_content_id ON likes (content_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscribed_to ON subscriptions (subscribed_to);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions (subscriber);
CREATE INDEX IF NOT EXISTS idx_reports_content_id ON reports (content_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);

-- ============================================================
-- SEED GENRES
-- ============================================================
INSERT INTO genres (name, type, sort_order) VALUES
  ('Electronic', 'music', 1), ('Hip-Hop', 'music', 2), ('Rock', 'music', 3),
  ('Pop', 'music', 4), ('Jazz', 'music', 5), ('Classical', 'music', 6),
  ('Folk', 'music', 7), ('Ambient', 'music', 8), ('R&B', 'music', 9), ('Metal', 'music', 10),
  ('Digital Art', 'art', 1), ('Photography', 'art', 2), ('Painting', 'art', 3),
  ('Illustration', 'art', 4), ('3D Art', 'art', 5), ('Abstract', 'art', 6),
  ('Surrealism', 'art', 7), ('Concept Art', 'art', 8), ('Pixel Art', 'art', 9), ('Mixed Media', 'art', 10)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- STORAGE BUCKETS + POLICIES
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('content-media', 'content-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('cover-images', 'cover-images', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
CREATE POLICY "Anyone can read avatars" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = owner);
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Anyone can read content media" ON storage.objects;
CREATE POLICY "Anyone can read content media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'content-media');
DROP POLICY IF EXISTS "Authenticated users can upload content media" ON storage.objects;
CREATE POLICY "Authenticated users can upload content media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'content-media');
DROP POLICY IF EXISTS "Users can update own content media" ON storage.objects;
CREATE POLICY "Users can update own content media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'content-media' AND auth.uid() = owner);
DROP POLICY IF EXISTS "Users can delete own content media" ON storage.objects;
CREATE POLICY "Users can delete own content media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'content-media' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Anyone can read cover images" ON storage.objects;
CREATE POLICY "Anyone can read cover images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'cover-images');
DROP POLICY IF EXISTS "Authenticated users can upload cover images" ON storage.objects;
CREATE POLICY "Authenticated users can upload cover images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cover-images');
DROP POLICY IF EXISTS "Users can update own cover images" ON storage.objects;
CREATE POLICY "Users can update own cover images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cover-images' AND auth.uid() = owner);
DROP POLICY IF EXISTS "Users can delete own cover images" ON storage.objects;
CREATE POLICY "Users can delete own cover images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cover-images' AND auth.uid() = owner);
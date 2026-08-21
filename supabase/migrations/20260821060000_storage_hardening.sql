-- Storage hardening: size limits + path must start with auth.uid()

UPDATE storage.buckets
SET file_size_limit = 5242880  -- 5 MB
WHERE id = 'avatars';

UPDATE storage.buckets
SET file_size_limit = 15728640  -- 15 MB (matches upload UI)
WHERE id = 'content-media';

UPDATE storage.buckets
SET file_size_limit = 5242880  -- 5 MB covers
WHERE id = 'cover-images';

-- Prefer folder ownership: first path segment = user id
DROP POLICY IF EXISTS "Authenticated users can upload content media" ON storage.objects;
CREATE POLICY "Authenticated users can upload content media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'content-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own content media" ON storage.objects;
CREATE POLICY "Users can update own content media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'content-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own content media" ON storage.objects;
CREATE POLICY "Users can delete own content media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'content-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can upload cover images" ON storage.objects;
CREATE POLICY "Authenticated users can upload cover images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cover-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own cover images" ON storage.objects;
CREATE POLICY "Users can update own cover images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cover-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own cover images" ON storage.objects;
CREATE POLICY "Users can delete own cover images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cover-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Keep public read on content + covers (discovery site)
-- avatars already readable via public bucket

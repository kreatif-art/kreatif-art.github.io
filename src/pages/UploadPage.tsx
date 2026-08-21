import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useGenres } from '@/hooks/useContent';
import { LoadingState } from '@/components/States';
import { ORIGINALITY_ATTESTATION_TEXT } from '@/types';
import { checkGenreAlignment } from '@/lib/genreMatch';
import { Upload as UploadIcon, Music, Image, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB

const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function UploadPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { genres: musicGenres } = useGenres('music');
  const { genres: artGenres } = useGenres('art');

  const [type, setType] = useState<'music' | 'art'>('music');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genreId, setGenreId] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [attested, setAttested] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [genreWarning, setGenreWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const genres = type === 'music' ? musicGenres : artGenres;

  useEffect(() => {
    if (!profile?.is_artist) {
      navigate('/profile');
    }
  }, [profile, navigate]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (type === 'music') {
      if (!AUDIO_TYPES.includes(file.type)) {
        setError('Audio file must be MP3 format.');
        return;
      }
      if (file.size > MAX_AUDIO_SIZE) {
        setError('Audio file must be under 15MB.');
        return;
      }
    } else {
      if (!IMAGE_TYPES.includes(file.type)) {
        setError('Art file must be JPG, PNG, or WebP.');
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError('Art file must be under 10MB.');
        return;
      }
    }

    setMediaFile(file);
    if (type === 'art') {
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Cover image must be JPG, PNG, or WebP.');
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      setError('Cover image must be under 5MB.');
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setError(null);

    if (!mediaFile) {
      setError('Please select a file to upload.');
      return;
    }
    if (title.trim().length < 2) {
      setError('Title must be at least 2 characters.');
      return;
    }
    if (!genreId) {
      setError('Please select a genre.');
      return;
    }
    const selectedGenre = genres.find((g) => g.id === genreId);
    if (selectedGenre) {
      const match = checkGenreAlignment({
        type,
        genreName: selectedGenre.name,
        title: title.trim(),
        description: description.trim(),
      });
      if (match.severity === 'strong_mismatch') {
        setError(match.message || 'Genre does not seem to match this work. Please review.');
        return;
      }
      if (match.severity === 'warn' && match.message) {
        setGenreWarning(match.message);
      }
    }
    if (!attested) {
      setError('You must confirm the originality attestation.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Upload media file
      const mediaExt = mediaFile.name.split('.').pop();
      const mediaPath = `${user.id}/${type}-${Date.now()}.${mediaExt}`;
      setProgress(10);
      const { error: mediaUploadError } = await supabase.storage
        .from('content-media')
        .upload(mediaPath, mediaFile, { upsert: false });

      if (mediaUploadError) throw mediaUploadError;

      const { data: mediaUrlData } = supabase.storage.from('content-media').getPublicUrl(mediaPath);

      // Upload cover image (optional, music only)
      let coverUrl: string | null = null;
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `${user.id}/cover-${Date.now()}.${coverExt}`;
        const { error: coverUploadError } = await supabase.storage
          .from('cover-images')
          .upload(coverPath, coverFile);

        if (coverUploadError) throw coverUploadError;

        const { data: coverUrlData } = supabase.storage.from('cover-images').getPublicUrl(coverPath);
        coverUrl = coverUrlData.publicUrl;
      }

      setProgress(75);

      // Insert content record
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert({
          user_id: user.id,
          type,
          title: title.trim(),
          description: description.trim(),
          genre_id: genreId,
          file_url: mediaUrlData.publicUrl,
          cover_image_url: coverUrl,
          visibility: 'visible',
        })
        .select('id')
        .single();

      if (contentError) throw contentError;

      setProgress(90);

      // Insert originality attestation
      const { error: attestationError } = await supabase
        .from('originality_attestations')
        .insert({
          user_id: user.id,
          content_id: contentData.id,
          attested_text: ORIGINALITY_ATTESTATION_TEXT,
        });

      if (attestationError) throw attestationError;

      setProgress(100);
      setSuccess(true);
      setUploading(false);

      setTimeout(() => {
        navigate(`/content/${contentData.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  if (!profile?.is_artist) return <LoadingState className="min-h-screen" />;

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Upload successful!</h1>
          <p className="mt-2 text-sm text-neutral-400">Redirecting to your content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
          <UploadIcon className="h-6 w-6 text-orange-400" />
          Upload your work
        </h1>

        {/* Type toggle */}
        <div className="mb-6 flex gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
          <button
            onClick={() => { setType('music'); setMediaFile(null); setMediaPreview(null); }}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
              type === 'music' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            <Music className="h-4 w-4" /> Music
          </button>
          <button
            onClick={() => { setType('art'); setMediaFile(null); setMediaPreview(null); }}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
              type === 'art' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            <Image className="h-4 w-4" /> Art
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {genreWarning && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">{genreWarning}</p>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Media file */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              {type === 'music' ? 'Audio file (MP3, max 15MB)' : 'Art image (JPG/PNG/WebP, max 10MB)'}
            </label>
            {mediaFile ? (
              <div className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3">
                <div className="flex items-center gap-2">
                  {type === 'music' ? <Music className="h-4 w-4 text-orange-400" /> : <Image className="h-4 w-4 text-pink-400" />}
                  <span className="truncate text-sm text-neutral-200">{mediaFile.name}</span>
                </div>
                <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="text-neutral-400 hover:text-neutral-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-700 py-8 transition-colors hover:border-neutral-600">
                {type === 'art' && mediaPreview ? (
                  <img src={mediaPreview} alt="" className="max-h-32 rounded-md" />
                ) : (
                  <>
                    <UploadIcon className="h-6 w-6 text-neutral-500" />
                    <span className="mt-2 text-sm text-neutral-400">Click to select a file</span>
                  </>
                )}
                <input type="file" accept={type === 'music' ? 'audio/mpeg,audio/mp3' : 'image/jpeg,image/png,image/webp'} onChange={handleMediaSelect} className="hidden" />
              </label>
            )}
          </div>

          {/* Cover image (music only) */}
          {type === 'music' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Cover image (optional, JPG/PNG/WebP, max 5MB)</label>
              {coverFile ? (
                <div className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {coverPreview && <img src={coverPreview} alt="" className="h-10 w-10 rounded object-cover" />}
                    <span className="truncate text-sm text-neutral-200">{coverFile.name}</span>
                  </div>
                  <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="text-neutral-400 hover:text-neutral-200">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-700 py-6 transition-colors hover:border-neutral-600">
                  <span className="text-sm text-neutral-400">Click to add a cover image</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverSelect} className="hidden" />
                </label>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Title</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your work a title"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Describe your work..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Genre</label>
            <select
              required
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-200 focus:border-neutral-600 focus:outline-none"
            >
              <option value="">Select a genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Originality attestation */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-orange-500"
              />
              <span className="text-sm text-neutral-300">{ORIGINALITY_ATTESTATION_TEXT}</span>
            </label>
            <p className="mt-2 text-xs text-neutral-500">
              This attestation is stored with your user ID and timestamp as a legal record.
            </p>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center justify-between text-sm text-neutral-300">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-800">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Publish'}
          </button>
        </form>
      </div>
    </div>
  );
}

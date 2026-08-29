import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useGenres } from '@/hooks/useContent';
import { LoadingState } from '@/components/States';
import { ORIGINALITY_ATTESTATION_TEXT, FREE_UPLOADS_PER_MONTH } from '@/types';
import { checkGenreAlignment } from '@/lib/genreMatch';
import {
  MEDIA,
  formatBytes,
  validateMusicFile,
  validateArtFile,
  validateCoverFile,
} from '@/lib/mediaStandards';
import { Upload as UploadIcon, Music, Image, Loader2, AlertCircle, CheckCircle2, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sha256File } from '@/lib/fileHash';
import { DisputeForm } from '@/components/DisputeForm';

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
  const [dupMatch, setDupMatch] = useState<{
    id: string;
    title: string;
    type: string;
    artist_name: string;
  } | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [mediaMeta, setMediaMeta] = useState<{ durationSec?: number; width?: number; height?: number } | null>(null);

  const genres = type === 'music' ? musicGenres : artGenres;

  // Non-artists see interstitial below (no silent redirect)

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMediaMeta(null);

    if (type === 'music') {
      const check = await validateMusicFile(file);
      if (!check.ok) {
        setError(check.error);
        e.target.value = '';
        return;
      }
      setMediaFile(file);
      setMediaPreview(null);
      setMediaMeta({ durationSec: check.durationSec });
    } else {
      const check = await validateArtFile(file);
      if (!check.ok) {
        setError(check.error);
        e.target.value = '';
        return;
      }
      setMediaFile(file);
      setMediaMeta({ width: check.width, height: check.height });
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const check = await validateCoverFile(file);
    if (!check.ok) {
      setError(check.error);
      e.target.value = '';
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
    const isPro = !!(profile?.is_pro && (!profile.pro_until || new Date(profile.pro_until) > new Date()));
    if (!isPro) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString());
      if ((count || 0) >= FREE_UPLOADS_PER_MONTH) {
        setError(`Free plan allows ${FREE_UPLOADS_PER_MONTH} uploads per month. Upgrade to Artist Pro for higher limits.`);
        return;
      }
    }

    setUploading(true);
    setProgress(0);
    setDupMatch(null);

    try {
      setProgress(5);
      const fp = await sha256File(mediaFile);
      setFingerprint(fp);
      const { data: existingRows, error: fpErr } = await supabase.rpc('find_content_by_fingerprint', {
        p_fingerprint: fp,
      });
      if (fpErr) console.warn(fpErr);
      const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows;
      if (existing?.id) {
        setDupMatch({
          id: existing.id,
          title: existing.title,
          type: existing.type,
          artist_name: existing.artist_name,
        });
        setError('This file is already on Kreatif. You cannot upload a duplicate.');
        setUploading(false);
        return;
      }

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
          duration_sec: type === 'music' ? (mediaMeta?.durationSec ?? null) : null,
          content_fingerprint: fp,
          file_size_bytes: mediaFile.size,
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
      }, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-medium text-white">Sign in to upload</h1>
        <p className="mt-2 max-w-sm text-sm text-neutral-400">
          Publishing music and art is for artists. Create an account, then turn on artist mode from your profile.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/login" className="rounded-full bg-white px-5 py-2 text-sm font-medium text-neutral-900">
            Log in
          </Link>
          <Link to="/signup" className="rounded-full border border-white/20 px-5 py-2 text-sm text-neutral-200">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  if (profile && !profile.is_artist) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <p className="label-caps mb-2 text-orange-400/80">Artist mode</p>
        <h1 className="text-2xl font-medium text-white sm:text-3xl">Upload is for artists</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
          Fans can browse, like, subscribe, and tip. To publish original music or visual art, enable
          <span className="text-neutral-200"> Artist mode </span>
          on your profile. You can turn it off anytime.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/profile"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-900"
          >
            Go to profile — enable artist mode
          </Link>
          <Link
            to="/how-to-upload"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-neutral-300"
          >
            How uploading works
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) return <LoadingState className="min-h-screen" />;

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">You&apos;re live</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Work is published. Opening the page so you can share the link with fans.
          </p>
          <p className="mt-3 text-xs text-neutral-600">Tip: complete your profile bio and avatar for stronger discovery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-white">
          <UploadIcon className="h-6 w-6 text-orange-400" />
          Upload your work
        </h1>
        <p className="mb-4 text-xs text-neutral-500">
          {profile?.is_pro && (!profile.pro_until || new Date(profile.pro_until) > new Date()) ? (
            'Artist Pro — higher upload allowance (no free-tier monthly cap).'
          ) : (
            <>
              Free plan — up to {FREE_UPLOADS_PER_MONTH} uploads per month.{' '}
              <Link to="/pro" className="text-orange-300/90 hover:underline">Upgrade to Pro</Link>
            </>
          )}
        </p>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-neutral-400">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-200">
            <Info className="h-4 w-4 text-orange-300/90" />
            Upload standards
          </div>
          {type === 'music' ? (
            <ul className="list-inside list-disc space-y-1">
              <li>Format: <span className="text-neutral-300">{MEDIA.music.formatLabel}</span></li>
              <li>Max size: <span className="text-neutral-300">{formatBytes(MEDIA.music.maxBytes)}</span></li>
              <li>Length: <span className="text-neutral-300">{MEDIA.music.minDurationSec}s – {MEDIA.music.maxDurationSec / 60} min</span></li>
              <li>Recommended: <span className="text-neutral-300">{MEDIA.music.recommendedBitrate}</span></li>
              {MEDIA.music.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : (
            <ul className="list-inside list-disc space-y-1">
              <li>Format: <span className="text-neutral-300">{MEDIA.art.formatLabel}</span></li>
              <li>Max file size: <span className="text-neutral-300">{formatBytes(MEDIA.art.maxBytes)}</span></li>
              <li>Min pixels: <span className="text-neutral-300">{MEDIA.art.minWidth}×{MEDIA.art.minHeight}</span></li>
              <li>Max pixels: <span className="text-neutral-300">{MEDIA.art.maxWidth}×{MEDIA.art.maxHeight}</span></li>
              <li>Recommended: <span className="text-neutral-300">{MEDIA.art.recommended}</span></li>
              {MEDIA.art.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-neutral-500">
            Technical checks run in your browser before upload. Genre text is checked for obvious mismatches. Reports + admin can still remove work that violates originality or quality.
          </p>
        </div>

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
          {dupMatch && fingerprint && (
            <DisputeForm fingerprint={fingerprint} existing={dupMatch} />
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
                  <span className="truncate text-sm text-neutral-200">{mediaFile.name}{mediaMeta?.durationSec != null ? ` · ${mediaMeta.durationSec}s` : ''}{mediaMeta?.width ? ` · ${mediaMeta.width}×${mediaMeta.height}px` : ''}</span>
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

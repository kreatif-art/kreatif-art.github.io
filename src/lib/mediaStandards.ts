/**
 * Kreatif upload standards — enforced client-side; storage also caps file size.
 * Human moderation can still hide/remove works that pass technical checks.
 */

export const MEDIA = {
  music: {
    formats: ['audio/mpeg', 'audio/mp3'] as const,
    formatLabel: 'MP3',
    maxBytes: 15 * 1024 * 1024, // 15 MB (matches content-media bucket)
    minDurationSec: 15,
    maxDurationSec: 15 * 60, // 15 minutes
    recommendedBitrate: '192–320 kbps CBR or VBR ~V0',
    notes: [
      'Original work only (or rights you control).',
      'Clear, listenable mix — avoid pure silence, pure noise, or severely clipped audio.',
      'Pick the genre that matches the sound, not the mood board.',
    ],
  },
  art: {
    formats: ['image/jpeg', 'image/png', 'image/webp'] as const,
    formatLabel: 'JPEG, PNG, or WebP',
    maxBytes: 10 * 1024 * 1024, // 10 MB
    minWidth: 800,
    minHeight: 800,
    maxWidth: 8000,
    maxHeight: 8000,
    recommended: 'Longest side 1500–4000px for web viewing',
    notes: [
      'Original work only (or rights you control).',
      'Pixel art may be smaller in *style* but still upload at readable resolution (min 800×800).',
      'No watermarks covering the whole piece; no stock dumps mislabeled as yours.',
    ],
  },
  cover: {
    formats: ['image/jpeg', 'image/png', 'image/webp'] as const,
    maxBytes: 5 * 1024 * 1024,
    minWidth: 600,
    minHeight: 600,
  },
} as const;

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export type MediaCheckResult =
  | { ok: true; durationSec?: number; width?: number; height?: number }
  | { ok: false; error: string };

/** Read audio duration via browser Audio element */
export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      URL.revokeObjectURL(url);
      if (!Number.isFinite(d) || d <= 0) reject(new Error('Could not read audio duration.'));
      else resolve(d);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this audio file.'));
    };
    audio.src = url;
  });
}

/** Read image dimensions */
export function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image file.'));
    };
    img.src = url;
  });
}

export async function validateMusicFile(file: File): Promise<MediaCheckResult> {
  const m = MEDIA.music;
  if (!(m.formats as readonly string[]).includes(file.type) && !file.name.toLowerCase().endsWith('.mp3')) {
    return { ok: false, error: `Music must be ${m.formatLabel}.` };
  }
  if (file.size > m.maxBytes) {
    return { ok: false, error: `Music file must be under ${formatBytes(m.maxBytes)} (yours is ${formatBytes(file.size)}).` };
  }
  if (file.size < 8 * 1024) {
    return { ok: false, error: 'File is too small to be a valid track.' };
  }
  try {
    const durationSec = await readAudioDuration(file);
    if (durationSec < m.minDurationSec) {
      return { ok: false, error: `Track must be at least ${m.minDurationSec} seconds (detected ${Math.round(durationSec)}s).` };
    }
    if (durationSec > m.maxDurationSec) {
      return { ok: false, error: `Track must be under ${m.maxDurationSec / 60} minutes (detected ${Math.round(durationSec / 60)} min).` };
    }
    return { ok: true, durationSec: Math.round(durationSec) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid audio file.' };
  }
}

export async function validateArtFile(file: File): Promise<MediaCheckResult> {
  const m = MEDIA.art;
  if (!(m.formats as readonly string[]).includes(file.type)) {
    return { ok: false, error: `Art must be ${m.formatLabel}.` };
  }
  if (file.size > m.maxBytes) {
    return { ok: false, error: `Image must be under ${formatBytes(m.maxBytes)} (yours is ${formatBytes(file.size)}).` };
  }
  if (file.size < 2 * 1024) {
    return { ok: false, error: 'File is too small to be a valid artwork.' };
  }
  try {
    const { width, height } = await readImageSize(file);
    if (width < m.minWidth || height < m.minHeight) {
      return {
        ok: false,
        error: `Image must be at least ${m.minWidth}×${m.minHeight}px (yours is ${width}×${height}px). Upscale pixel art carefully or export a larger canvas.`,
      };
    }
    if (width > m.maxWidth || height > m.maxHeight) {
      return {
        ok: false,
        error: `Image must be at most ${m.maxWidth}×${m.maxHeight}px (yours is ${width}×${height}px). Resize and re-export.`,
      };
    }
    return { ok: true, width, height };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid image file.' };
  }
}

export async function validateCoverFile(file: File): Promise<MediaCheckResult> {
  const m = MEDIA.cover;
  if (!(m.formats as readonly string[]).includes(file.type)) {
    return { ok: false, error: 'Cover must be JPEG, PNG, or WebP.' };
  }
  if (file.size > m.maxBytes) {
    return { ok: false, error: `Cover must be under ${formatBytes(m.maxBytes)}.` };
  }
  try {
    const { width, height } = await readImageSize(file);
    if (width < m.minWidth || height < m.minHeight) {
      return { ok: false, error: `Cover should be at least ${m.minWidth}×${m.minHeight}px (yours is ${width}×${height}px).` };
    }
    return { ok: true, width, height };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid cover image.' };
  }
}

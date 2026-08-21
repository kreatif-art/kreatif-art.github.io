/**
 * Lightweight genre alignment helper (rules + keywords).
 * Not a full ML model — flags likely mismatches at upload time.
 */

const MUSIC_HINTS: Record<string, string[]> = {
  Electronic: ['electronic', 'synth', 'techno', 'house', 'edm', 'trance', 'electro', 'bass'],
  'Hip-Hop': ['hip-hop', 'hip hop', 'rap', 'trap', 'beat', 'mc', 'bars'],
  Rock: ['rock', 'guitar', 'indie rock', 'alt rock', 'punk', 'riff'],
  Pop: ['pop', 'catchy', 'chorus', 'radio'],
  Jazz: ['jazz', 'sax', 'swing', 'bebop', 'improvis', 'trumpet', 'bossa'],
  Classical: ['classical', 'orchestra', 'symphony', 'sonata', 'concerto', 'piano sonata', 'string quartet'],
  Folk: ['folk', 'acoustic', 'americana', 'roots', 'ballad'],
  Ambient: ['ambient', 'drone', 'atmospheric', 'soundscape', 'pad'],
  'R&B': ['r&b', 'rnb', 'soul', 'neo-soul', 'groove'],
  Metal: ['metal', 'heavy', 'thrash', 'doom', 'black metal', 'death metal'],
};

const ART_HINTS: Record<string, string[]> = {
  'Digital Art': ['digital', 'cgi', 'photoshop', 'procreate', 'render'],
  Photography: ['photo', 'photograph', 'camera', 'lens', 'portrait', 'street photo'],
  Painting: ['paint', 'oil', 'acrylic', 'watercolor', 'canvas', 'brush'],
  Illustration: ['illustration', 'illustrat', 'drawing', 'ink', 'character art'],
  '3D Art': ['3d', 'blender', 'cinema4d', 'sculpt', 'mesh', 'octane'],
  Abstract: ['abstract', 'non-figurative', 'geometry', 'color field'],
  Surrealism: ['surreal', 'dreamlike', 'impossible', 'magritte'],
  'Concept Art': ['concept', 'environment art', 'character design', 'worldbuilding'],
  'Pixel Art': ['pixel', '8-bit', '16-bit', 'sprite', 'retro game'],
  'Mixed Media': ['mixed media', 'collage', 'assemblage', 'found object'],
};

export type GenreMatchResult = {
  ok: boolean;
  severity: 'ok' | 'warn' | 'strong_mismatch';
  message?: string;
  suggested?: string[];
};

export function checkGenreAlignment(opts: {
  type: 'music' | 'art';
  genreName: string;
  title: string;
  description: string;
}): GenreMatchResult {
  const text = `${opts.title} ${opts.description}`.toLowerCase();
  const table = opts.type === 'music' ? MUSIC_HINTS : ART_HINTS;
  const own = table[opts.genreName] || [];

  // If text has strong signals for a *different* genre, warn
  const scores: { name: string; score: number }[] = [];
  for (const [name, keys] of Object.entries(table)) {
    let score = 0;
    for (const k of keys) {
      if (text.includes(k.toLowerCase())) score += k.length > 4 ? 2 : 1;
    }
    if (score) scores.push({ name, score });
  }
  scores.sort((a, b) => b.score - a.score);

  if (!scores.length) {
    return { ok: true, severity: 'ok' }; // no signals either way
  }

  const top = scores[0];
  const ownScore = scores.find((s) => s.name === opts.genreName)?.score ?? 0;

  if (top.name !== opts.genreName && top.score >= 2 && top.score > ownScore) {
    return {
      ok: false,
      severity: top.score >= 4 ? 'strong_mismatch' : 'warn',
      message: `Your text reads more like “${top.name}” than “${opts.genreName}”. Pick the genre that best matches the file, or adjust the title/description.`,
      suggested: scores.slice(0, 3).map((s) => s.name),
    };
  }

  if (ownScore > 0) {
    return { ok: true, severity: 'ok', message: `Looks aligned with ${opts.genreName}.` };
  }

  return { ok: true, severity: 'ok' };
}

import { Link } from 'react-router-dom';
import { Upload, User, ShieldCheck, Music, Image, Eye } from 'lucide-react';
import { MEDIA, formatBytes } from '@/lib/mediaStandards';
import { useAuth } from '@/context/AuthContext';

const steps = [
  {
    n: '01',
    icon: User,
    title: 'Create an account',
    body: 'Sign up with email. Your profile is created automatically.',
  },
  {
    n: '02',
    icon: ShieldCheck,
    title: 'Turn on artist mode',
    body: 'Open Profile and enable artist mode so you can publish.',
  },
  {
    n: '03',
    icon: Upload,
    title: 'Open Upload',
    body: 'Choose Music or Art, then add a title, description, and genre.',
  },
  {
    n: '04',
    icon: Music,
    title: 'Attach your file',
    body: 'Music needs an audio file (and optional cover). Art needs an image.',
  },
  {
    n: '05',
    icon: Eye,
    title: 'Attest & publish',
    body: 'Confirm the work is original or that you hold the rights, then submit. It appears in Browse when visible.',
  },
];

export function HowToUploadPage() {
  const { user, profile } = useAuth();
  const canUpload = !!user && profile?.is_artist;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="label-caps mb-3 text-orange-400/80">Guide</p>
        <h1
          className="text-4xl tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
        >
          How to upload
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-400">
          Kreatif is for original music and visual art. Five steps from account to published work.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
              <Music className="h-4 w-4 text-orange-300/90" /> Music
            </div>
            <ul className="space-y-1 text-xs text-neutral-400">
              <li>{MEDIA.music.formatLabel} · max {formatBytes(MEDIA.music.maxBytes)}</li>
              <li>{MEDIA.music.minDurationSec}s – {MEDIA.music.maxDurationSec / 60} min</li>
              <li>{MEDIA.music.recommendedBitrate}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
              <Image className="h-4 w-4 text-orange-300/90" /> Visual art
            </div>
            <ul className="space-y-1 text-xs text-neutral-400">
              <li>{MEDIA.art.formatLabel} · max {formatBytes(MEDIA.art.maxBytes)}</li>
              <li>Min {MEDIA.art.minWidth}×{MEDIA.art.minHeight}px</li>
              <li>Max {MEDIA.art.maxWidth}×{MEDIA.art.maxHeight}px</li>
            </ul>
          </div>
        </div>

        <ol className="mt-12 space-y-0">
          {steps.map((s, i) => (
            <li
              key={s.n}
              className="relative flex gap-5 border-l border-white/[0.08] pb-10 pl-6 last:pb-0"
            >
              <span className="absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-neutral-950 text-[10px] text-neutral-500">
                {i + 1}
              </span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <s.icon className="h-4 w-4 text-orange-300/80" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">{s.n}</p>
                <h2 className="mt-0.5 text-lg font-medium text-white">{s.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          {canUpload ? (
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-900"
            >
              <Upload className="h-4 w-4" /> Go to Upload
            </Link>
          ) : user ? (
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-900"
            >
              Enable artist mode
            </Link>
          ) : (
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-900"
            >
              Sign up to start
            </Link>
          )}
          <Link
            to="/browse/music"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-neutral-300 hover:text-white"
          >
            <Music className="h-4 w-4" /> Browse music
          </Link>
          <Link
            to="/browse/art"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-neutral-300 hover:text-white"
          >
            <Image className="h-4 w-4" /> Browse art
          </Link>
        </div>

        <p className="mt-12 text-xs leading-relaxed text-neutral-600">
          By uploading you agree that the work is original or that you hold rights to share it. See{' '}
          <Link to="/terms" className="text-neutral-400 underline-offset-2 hover:underline">
            Terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, Upload, User, FileText, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'kreatif_onboarding_dismissed';

/**
 * 5-minute creator activation: avatar → bio → first upload.
 * Shown to signed-in users until complete or dismissed.
 */
export function CreatorOnboarding({ className }: { className?: string }) {
  const { user, profile } = useAuth();
  const [uploadCount, setUploadCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => {
        if (!cancelled) setUploadCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || !profile || dismissed || uploadCount === null) return null;

  const hasAvatar = !!(profile.avatar_url && profile.avatar_url.trim());
  const hasBio = !!(profile.bio && profile.bio.trim().length >= 20);
  const isArtist = !!profile.is_artist;
  const hasUpload = uploadCount > 0;

  const steps = [
    {
      id: 'artist',
      done: isArtist,
      label: 'Turn on Artist mode',
      href: '/profile',
      icon: User,
    },
    {
      id: 'avatar',
      done: hasAvatar,
      label: 'Add a profile image',
      href: '/profile',
      icon: User,
    },
    {
      id: 'bio',
      done: hasBio,
      label: 'Write a short bio',
      href: '/profile',
      icon: FileText,
    },
    {
      id: 'upload',
      done: hasUpload,
      label: 'Publish your first work',
      href: '/upload',
      icon: Upload,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount >= steps.length) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const next = steps.find((s) => !s.done);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/[0.07] via-white/[0.03] to-transparent p-4 sm:p-5',
        className,
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-neutral-500 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="label-caps text-orange-400/80">Creator setup</p>
      <h2 className="mt-1 text-base font-medium text-white sm:text-lg">Get discoverable in a few minutes</h2>
      <p className="mt-1 max-w-md text-xs text-neutral-500">
        Complete these steps so fans can find you, tip you, and follow your work.
      </p>

      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              to={step.href}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                step.done
                  ? 'border-white/[0.06] bg-white/[0.02] text-neutral-500'
                  : 'border-white/10 bg-white/[0.04] text-neutral-200 hover:border-white/20',
              )}
            >
              {step.done ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-orange-400/70" />
              )}
              <span className={cn('flex-1', step.done && 'line-through')}>{step.label}</span>
              {!step.done && <ArrowRight className="h-3.5 w-3.5 text-neutral-500" />}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-neutral-600">
          {doneCount}/{steps.length} complete
        </p>
        {next && (
          <Link to={next.href} className="btn-primary text-xs">
            {next.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

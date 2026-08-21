import { Link } from 'react-router-dom';
import { BadgeCheck, BarChart3, Sparkles, Upload, Star, HeartHandshake } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ARTIST_PRO_PRICE_USD, FREE_UPLOADS_PER_MONTH } from '@/types';
import { useState } from 'react';

const FEATURES = [
  {
    icon: BadgeCheck,
    title: 'Pro badge',
    body: 'A clear Pro mark on your profile and works so fans know you’re investing in your practice.',
  },
  {
    icon: BarChart3,
    title: 'Artist analytics',
    body: 'Likes, subscribers, tip totals, and uploads at a glance — so you know what resonates.',
  },
  {
    icon: Star,
    title: 'Featured eligibility',
    body: 'One featured spotlight per month on a genre reel or home rotation (labeled, not pay-for-rank on leaderboard).',
  },
  {
    icon: Upload,
    title: 'Higher upload allowance',
    body: `Free artists get ${FREE_UPLOADS_PER_MONTH} uploads / month. Pro is effectively unlimited for normal use (fair-use cap).`,
  },
  {
    icon: HeartHandshake,
    title: 'Tip jar emphasis',
    body: 'Your tip balance and tip button are highlighted so support is easy to find.',
  },
  {
    icon: Sparkles,
    title: 'Early access',
    body: 'First look at new creator tools as we ship them.',
  },
];

export function ProPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isPro = !!(profile?.is_pro && (!profile.pro_until || new Date(profile.pro_until) > new Date()));

  const activateDemo = async () => {
    if (!user) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.rpc('activate_pro', { p_months: 1 });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    await refreshProfile();
    setMsg('Artist Pro activated for 1 month (beta). Stripe billing can replace this demo activation.');
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="label-caps mb-3 text-orange-400/80">Artist Pro</p>
        <h1
          className="text-4xl tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
        >
          Tools for working artists
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-400">
          Kreatif stays free to browse, listen, and upload. The platform only takes a cut when fans tip (10%).
          Pro is optional — <span className="text-neutral-200">${ARTIST_PRO_PRICE_USD.toFixed(2)}/month</span> for
          analytics, badge, featured eligibility, and higher limits.
        </p>

        <div className="mt-8 flex flex-wrap items-end gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div>
            <p className="text-sm text-neutral-500">Monthly</p>
            <p className="text-4xl font-medium text-white">
              ${ARTIST_PRO_PRICE_USD.toFixed(2)}
              <span className="text-base font-normal text-neutral-500"> / mo</span>
            </p>
          </div>
          {user && profile?.is_artist ? (
            isPro ? (
              <p className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                You’re on Pro{profile.pro_until ? ` · until ${new Date(profile.pro_until).toLocaleDateString()}` : ''}
              </p>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={activateDemo}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 disabled:opacity-50"
              >
                {busy ? 'Activating…' : 'Activate Pro (beta)'}
              </button>
            )
          ) : (
            <Link to={user ? '/profile' : '/signup'} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-900">
              {user ? 'Enable artist mode first' : 'Sign up as an artist'}
            </Link>
          )}
        </div>
        {msg && <p className="mt-3 text-sm text-neutral-400">{msg}</p>}

        <ul className="mt-12 space-y-6">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                <f.icon className="h-4 w-4 text-orange-300/90" />
              </div>
              <div>
                <h2 className="text-base font-medium text-white">{f.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-white/[0.08] p-5 text-sm text-neutral-400">
          <p className="font-medium text-neutral-200">Free forever includes</p>
          <p className="mt-2">
            Browse, play, like, subscribe, upload (up to {FREE_UPLOADS_PER_MONTH}/month), and receive tips. No charge
            unless a fan tips you — then Kreatif keeps 10% and you keep 90%.
          </p>
        </div>
      </div>
    </div>
  );
}

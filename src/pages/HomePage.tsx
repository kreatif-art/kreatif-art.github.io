import { Link } from 'react-router-dom';
import { Music, Image, Trophy, Upload, ArrowRight, Heart, Users } from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { ContentCard } from '@/components/ContentCard';
import { LoadingState, EmptyState } from '@/components/States';
import { useAuth } from '@/context/AuthContext';

export function HomePage() {
  const { items: musicItems, loading: musicLoading } = useContent({ type: 'music', pageSize: 6 });
  const { items: artItems, loading: artLoading } = useContent({ type: 'art', pageSize: 6 });
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* ===== Hero ===== */}
      <section className="relative border-b border-neutral-800">
        {/* Subtle ambient gradient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 15% 20%, rgba(251,146,60,0.08), transparent 55%), radial-gradient(ellipse 60% 45% at 85% 15%, rgba(244,114,182,0.06), transparent 50%)',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-orange-400/90">
              Independent creators
            </p>

            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              A space for original music
              <br className="hidden sm:block" />
              <span className="text-neutral-400"> and visual art.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-neutral-400 sm:text-lg">
              Share your work. Discover artists. Build an audience that cares about the craft.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              {user ? (
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
                >
                  <Upload className="h-4 w-4" />
                  Upload work
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
                >
                  Join Kreatif
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/browse/music"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
              >
                Explore
              </Link>
            </div>

            {user && profile?.is_artist && (
              <p className="mt-4 text-sm text-neutral-500">
                Artist mode is active — you can publish content.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===== Feature strip ===== */}
      <section className="border-b border-neutral-800 bg-neutral-900/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-4 text-sm text-neutral-500 sm:px-6">
          {[
            { icon: Music, label: 'Original music' },
            { icon: Image, label: 'Visual art' },
            { icon: Heart, label: 'Likes & discovery' },
            { icon: Users, label: 'Artist subscriptions' },
            { icon: Trophy, label: 'Leaderboard' },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <item.icon className="h-3.5 w-3.5 text-orange-400/60" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* ===== Latest Music ===== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Latest music</h2>
            <p className="mt-1 text-sm text-neutral-500">Fresh tracks from the community</p>
          </div>
          <Link
            to="/browse/music"
            className="group flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-white"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {musicLoading ? (
          <LoadingState />
        ) : musicItems.length === 0 ? (
          <EmptyState
            title="No music yet"
            message="Be the first to share a track."
            action={
              <Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900">
                Upload
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {musicItems.map((item) => (
              <div
                key={item.id}
                className="h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/80 transition-colors hover:border-neutral-700"
              >
                <ContentCard item={item} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Latest Art ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Latest art</h2>
            <p className="mt-1 text-sm text-neutral-500">New pieces from visual creators</p>
          </div>
          <Link
            to="/browse/art"
            className="group flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-white"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {artLoading ? (
          <LoadingState />
        ) : artItems.length === 0 ? (
          <EmptyState
            title="No art yet"
            message="Be the first to share artwork."
            action={
              <Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900">
                Upload
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {artItems.map((item) => (
              <div
                key={item.id}
                className="h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/80 transition-colors hover:border-neutral-700"
              >
                <ContentCard item={item} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Leaderboard CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <Link to="/leaderboard" className="group block">
          <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-6 py-5 transition-colors hover:border-neutral-700 hover:bg-neutral-900">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Top 10</h3>
                <p className="text-sm text-neutral-500">Most-loved artists this season</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-neutral-500 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
          </div>
        </Link>
      </section>
    </div>
  );
}

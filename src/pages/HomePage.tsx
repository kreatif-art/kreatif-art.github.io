/* BUILD_MARKER_V2 */
import { Link } from 'react-router-dom';
import { Music, Image, Trophy, Upload, ArrowRight, Heart, Users } from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { useFadeUpRoot } from '@/hooks/useFadeUp';
import { ContentCard } from '@/components/ContentCard';
import { DailyShowcase } from '@/components/DailyShowcase';
import { LoadingState, EmptyState } from '@/components/States';
import { useAuth } from '@/context/AuthContext';

export function HomePage() {
  const { items: musicItems, loading: musicLoading } = useContent({ type: 'music', pageSize: 6 });
  const { items: artItems, loading: artLoading } = useContent({ type: 'art', pageSize: 6 });
  const { user, profile } = useAuth();
  const rootRef = useFadeUpRoot<HTMLDivElement>();

  return (
    <div ref={rootRef} className="min-h-screen bg-transparent">
      {/* ===== Hero — Coveo-inspired type hierarchy ===== */}
      <section className="relative border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 15% 20%, rgba(251,146,60,0.08), transparent 55%), radial-gradient(ellipse 60% 45% at 85% 15%, rgba(244,114,182,0.06), transparent 50%)',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(260px,360px)] lg:gap-16">
            <div className="max-w-2xl" data-fade-up>
              <p className="label-caps mb-6 text-orange-400/90">Sound &amp; sight</p>

              <h1 className="hero-title text-5xl text-white sm:text-6xl lg:text-[4.25rem]">
                A space for original music
                <br className="hidden sm:block" />
                <span className="text-white/55"> and visual art.</span>
              </h1>

              <p className="mt-7 max-w-md text-[15px] leading-relaxed text-neutral-400 sm:text-base">
                For day-dreamers, makers, and collectors — work that pairs sound with image, and meaning with craft.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                {user ? (
                  <Link
                    to="/upload"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-neutral-900 transition-transform duration-300 hover:scale-[1.02]"
                    style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  >
                    <Upload className="h-4 w-4" />
                    Upload work
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-neutral-900 transition-transform duration-300 hover:scale-[1.02]"
                    style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  >
                    Join Kreatif
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  to="/browse/music"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:border-white/30 hover:text-white"
                >
                  Explore
                </Link>
              </div>

              {user && profile?.is_artist && (
                <p className="mt-4 text-sm text-neutral-500">Artist mode is active — you can publish content.</p>
              )}
            </div>

            <div className="mx-auto w-full lg:mx-0" data-fade-up data-delay="2">
              <DailyShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Feature strip ===== */}
      <section className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-3.5 text-xs uppercase tracking-[0.14em] text-neutral-500 sm:px-6">
          {[
            { icon: Music, label: 'Original music' },
            { icon: Image, label: 'Visual art' },
            { icon: Heart, label: 'Likes & discovery' },
            { icon: Users, label: 'Subscriptions' },
            { icon: Trophy, label: 'Leaderboard' },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <item.icon className="h-3.5 w-3.5 text-orange-400/50" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* ===== Latest Music ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" data-fade-up data-delay="1">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="label-caps mb-2 text-neutral-500">Discography</p>
            <h2 className="font-serif text-2xl italic tracking-tight text-white sm:text-3xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Latest music
            </h2>
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
          <div className="content-masonry">
            {musicItems.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* ===== Latest Art ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6" data-fade-up data-delay="2">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="label-caps mb-2 text-neutral-500">Gallery</p>
            <h2 className="text-2xl italic tracking-tight text-white sm:text-3xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Latest art
            </h2>
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
          <div className="content-masonry">
            {artItems.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* ===== Leaderboard CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6" data-fade-up data-delay="3">
        <Link to="/leaderboard" className="group block">
          <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-5 backdrop-blur-sm transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">Top 10</h3>
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

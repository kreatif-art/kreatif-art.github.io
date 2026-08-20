/* BUILD_MARKER_V2 */
import { Link } from 'react-router-dom';
import { Music, Image, Trophy, Upload, ArrowRight, Heart, Users } from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { useFadeUpRoot } from '@/hooks/useFadeUp';
import { ContentCard } from '@/components/ContentCard';
import { DailyShowcase } from '@/components/DailyShowcase';
import { HorizontalRail } from '@/components/HorizontalRail';
import { SoundSightChapter } from '@/components/SoundSightChapter';
import { LoadingState, EmptyState } from '@/components/States';
import { useAuth } from '@/context/AuthContext';

export function HomePage() {
  const { items: musicItems, loading: musicLoading } = useContent({ type: 'music', pageSize: 6 });
  const { items: artItems, loading: artLoading } = useContent({ type: 'art', pageSize: 6 });
  const { user, profile } = useAuth();
  const rootRef = useFadeUpRoot<HTMLDivElement>();

  return (
    <div ref={rootRef} className="min-h-screen bg-transparent">
      {/* ===== Hero (tight, above-the-fold with feature strip) ===== */}
      <section className="relative border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 15% 20%, rgba(251,146,60,0.08), transparent 55%), radial-gradient(ellipse 60% 45% at 85% 15%, rgba(244,114,182,0.06), transparent 50%)',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-0 sm:px-6 sm:pt-8 lg:pt-10">
          <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 xl:gap-10">
            <div className="max-w-xl pt-2 lg:pt-4" data-fade-up>
              <p className="label-caps mb-3 text-orange-400/90">Sound &amp; sight</p>

              <h1 className="hero-title text-4xl leading-[1.08] text-white sm:text-5xl lg:text-[3.35rem]">
                A space for original{' '}
                <span className="font-musicnet not-italic text-orange-300">music</span>
                <br className="hidden sm:block" />
                <span className="text-white/55"> and </span>
                <span className="font-arthure not-italic text-pink-300/90">visual art</span>
                <span className="text-white/55">.</span>
              </h1>

              <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
                For day-dreamers, makers, and collectors — work that pairs sound with image, and meaning with craft.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {user ? (
                  <Link
                    to="/upload"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-neutral-900 transition-transform duration-300 hover:scale-[1.02]"
                    style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  >
                    <Upload className="h-4 w-4" />
                    Upload work
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-neutral-900 transition-transform duration-300 hover:scale-[1.02]"
                    style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  >
                    Join Kreatif
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  to="/browse/music"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/30 hover:text-white"
                >
                  Explore
                </Link>
              </div>

              {user && profile?.is_artist && (
                <p className="mt-3 text-xs text-neutral-500">Artist mode is active — you can publish content.</p>
              )}
            </div>

            <div className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none" data-fade-up data-delay="2">
              <DailyShowcase />
            </div>
          </div>

          {/* Feature strip — same viewport, no extra page jump */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/[0.06] py-3 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
            {[
              { icon: Music, label: 'Original music' },
              { icon: Image, label: 'Visual art' },
              { icon: Heart, label: 'Likes & discovery' },
              { icon: Users, label: 'Subscriptions' },
              { icon: Trophy, label: 'Leaderboard' },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <item.icon className="h-3 w-3 text-orange-400/55" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <SoundSightChapter />

      {/* ===== Music rail ===== */}
      <section className="relative border-t border-white/[0.04] py-6" data-fade-up data-delay="1">
        <div className="mx-auto mb-2 flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <h2 className="text-2xl tracking-tight">
            <span className="font-musicnet not-italic text-orange-300">Music</span>
          </h2>
          <Link to="/browse/music" className="text-xs uppercase tracking-[0.14em] text-neutral-500 hover:text-white">
            All music
          </Link>
        </div>

        {musicLoading ? (
          <div className="px-4"><LoadingState /></div>
        ) : musicItems.length === 0 ? (
          <div className="px-4">
            <EmptyState
              title="No music yet"
              message="Be the first to share a track."
              action={
                <Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900">
                  Upload
                </Link>
              }
            />
          </div>
        ) : (
          <HorizontalRail tone="music" sideLabel="MUSIC">
            {musicItems.map((item) => (
              <div key={item.id} className="rail-card">
                <ContentCard item={item} />
              </div>
            ))}
          </HorizontalRail>
        )}
      </section>

      {/* ===== Art rail ===== */}
      <section className="relative border-t border-white/[0.04] py-6" data-fade-up data-delay="2">
        <div className="mx-auto mb-2 flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <h2 className="text-2xl tracking-tight">
            <span className="font-arthure not-italic text-pink-300/90">Art</span>
          </h2>
          <Link to="/browse/art" className="text-xs uppercase tracking-[0.14em] text-neutral-500 hover:text-white">
            All art
          </Link>
        </div>

        {artLoading ? (
          <div className="px-4"><LoadingState /></div>
        ) : artItems.length === 0 ? (
          <div className="px-4">
            <EmptyState
              title="No art yet"
              message="Be the first to share artwork."
              action={
                <Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900">
                  Upload
                </Link>
              }
            />
          </div>
        ) : (
          <HorizontalRail tone="art" sideLabel="ART">
            {artItems.map((item) => (
              <div key={item.id} className="rail-card">
                <ContentCard item={item} />
              </div>
            ))}
          </HorizontalRail>
        )}
      </section>

      {/* ===== Leaderboard CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6" data-fade-up data-delay="3">
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

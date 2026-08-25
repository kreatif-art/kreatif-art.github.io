/* BUILD_MARKER_V2 */
import { Link } from 'react-router-dom';
import { Music, Image, Trophy, Upload, ArrowRight, Heart, Users, Link2 } from 'lucide-react';
import { useFadeUpRoot } from '@/hooks/useFadeUp';
import { DailyShowcase } from '@/components/DailyShowcase';
import { SoundSightChapter } from '@/components/SoundSightChapter';
import { PairOfTheDay } from '@/components/PairOfTheDay';
import { useAuth } from '@/context/AuthContext';
import { useFeaturedPairs } from '@/hooks/usePairs';

function isImageUrl(url?: string | null) {
  if (!url) return false;
  if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url)) return false;
  return true;
}

export function HomePage() {
  const { user, profile } = useAuth();
  const rootRef = useFadeUpRoot<HTMLDivElement>();
  const { pairs: featuredPairs } = useFeaturedPairs(8);

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

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-5 pb-0 sm:px-6 sm:pt-7 lg:pt-8">
          <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-7 xl:gap-9">
            <div className="max-w-xl pt-2 lg:pt-4" data-fade-up>
              <p className="label-caps mb-2.5 text-orange-400/80">Sound &amp; sight</p>

              <h1 className="hero-title text-[2.35rem] leading-[1.05] text-white sm:text-5xl lg:text-[3.25rem]">
                A space for original{' '}
                <span className="font-musicnet not-italic text-orange-300">music</span>
                <br className="hidden sm:block" />
                <span className="text-white/55"> and </span>
                <span className="font-arthure not-italic text-pink-300/90">visual art</span>
                <span className="text-white/55">.</span>
              </h1>

              <p className="mt-3.5 max-w-sm text-[13px] leading-relaxed text-neutral-500">
                For day-dreamers, makers, and collectors — work that pairs sound with image, and meaning with craft.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {user && profile?.is_artist ? (
                  <Link
                    to="/upload"
                    className="btn-primary"
                  >
                    <Upload className="h-4 w-4" />
                    Upload work
                  </Link>
                ) : user ? (
                  <Link
                    to="/profile"
                    className="btn-primary"
                  >
                    Enable artist mode
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="btn-primary"
                  >
                    Join Kreatif
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  to="/browse/music"
                  className="btn-ghost"
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

      <PairOfTheDay />

      {/* Sound & Sight pairs */}
      {featuredPairs.length > 0 && (
        <section className="border-b border-white/[0.06] py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="label-caps mb-1 text-orange-400/80">Paired works</p>
                <h2 className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}>
                  Sound &amp; Sight
                </h2>
                <p className="mt-1 text-xs text-neutral-500">One track, one artwork — linked on purpose.</p>
              </div>
              <Link2 className="h-5 w-5 text-neutral-600" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featuredPairs.map((pair) => (
                <div
                  key={pair.id}
                  className="flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <Link to={`/content/${pair.music_id}`} className="relative w-1/2 overflow-hidden bg-gradient-to-br from-orange-950/90 via-neutral-900 to-neutral-950">
                    {isImageUrl(pair.music?.cover_image_url) ? (
                      <img
                        src={pair.music!.cover_image_url!}
                        alt=""
                        className="h-36 w-full object-cover sm:h-40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center gap-1 px-2 sm:h-40">
                        <Music className="h-8 w-8 text-orange-300/60" />
                        <span className="line-clamp-2 text-center text-[10px] text-neutral-500">{pair.music?.title}</span>
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/90 backdrop-blur">
                      Sound
                    </span>
                  </Link>
                  <Link to={`/content/${pair.art_id}`} className="relative w-1/2 overflow-hidden bg-gradient-to-br from-pink-950/90 via-neutral-900 to-neutral-950">
                    {isImageUrl(pair.art?.file_url) ? (
                      <img
                        src={pair.art!.file_url!}
                        alt=""
                        className="h-36 w-full object-cover sm:h-40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center gap-1 px-2 sm:h-40">
                        <Image className="h-8 w-8 text-pink-300/60" />
                        <span className="line-clamp-2 text-center text-[10px] text-neutral-500">{pair.art?.title}</span>
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/90 backdrop-blur">
                      Sight
                    </span>
                  </Link>
                </div>
              ))}
            </div>
            {featuredPairs[0]?.note && (
              <p className="mt-4 text-center text-xs italic text-neutral-500">
                “{featuredPairs[0].note}”
              </p>
            )}
          </div>
        </section>
      )}




          </div>
  );
}

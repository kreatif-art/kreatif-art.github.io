import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Music, Image, Trophy, Upload, ArrowRight, Heart, Users, Sparkles } from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useMouseParallax } from '@/hooks/useMouseParallax';
import { ContentCard } from '@/components/ContentCard';
import { LoadingState, EmptyState } from '@/components/States';
import { useAuth } from '@/context/AuthContext';

export function HomePage() {
  const { items: musicItems, loading: musicLoading } = useContent({ type: 'music', pageSize: 6 });
  const { items: artItems, loading: artLoading } = useContent({ type: 'art', pageSize: 6 });
  const { user, profile } = useAuth();

  const heroRef = useRef<HTMLElement>(null);
  useMouseParallax(heroRef);

  const musicRef = useScrollReveal<HTMLDivElement>();
  const artRef = useScrollReveal<HTMLDivElement>();
  const ctaRef = useScrollReveal<HTMLDivElement>();

  const headlineText = 'Where artists and fans connect';
  const headlineChars = headlineText.split('');
  const connectStart = headlineText.indexOf('connect');

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* ===== Hero ===== */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center overflow-hidden border-b border-neutral-800"
      >
        {/* Liquid mesh gradient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="mesh-anim absolute inset-0 opacity-40" style={{
            background: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(251,146,60,0.12), transparent 60%), radial-gradient(ellipse 70% 50% at 80% 20%, rgba(244,114,182,0.10), transparent 55%), radial-gradient(ellipse 60% 80% at 50% 80%, rgba(251,191,36,0.06), transparent 50%)',
          }} />
        </div>

        {/* Floating gradient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="orb-1 absolute left-[8%] top-[15%] h-[420px] w-[420px] rounded-full bg-orange-600/12 blur-[120px]" />
          <div className="orb-2 absolute right-[5%] top-[8%] h-[360px] w-[360px] rounded-full bg-pink-600/10 blur-[100px]" />
          <div className="orb-1 absolute bottom-[8%] left-[35%] h-[320px] w-[320px] rounded-full bg-amber-500/8 blur-[90px]" style={{ animationDelay: '4s' }} />
        </div>

        {/* Morphing blob accent */}
        <div className="pointer-events-none absolute right-[10%] top-[50%] hidden lg:block">
          <div className="blob-morph spin-slow h-64 w-64 bg-gradient-to-br from-orange-500/8 to-pink-500/8 blur-[2px]" />
        </div>
        <div className="pointer-events-none absolute left-[5%] bottom-[20%] hidden lg:block">
          <div className="blob-morph spin-slow-reverse h-48 w-48 bg-gradient-to-tr from-amber-500/8 to-rose-500/8" />
        </div>

        {/* Mouse-parallax particle layer */}
        <div data-particle-layer className="pointer-events-none absolute inset-0 overflow-hidden" />

        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-4xl">
            {/* Badge — no icon, pulse ring */}
            <div
              className="fade-up mb-8 inline-flex items-center gap-0 rounded-full border border-orange-500/30 bg-orange-500/5 px-4 py-1.5 text-xs font-medium text-orange-300 backdrop-blur-sm pulse-ring"
              style={{ animationDelay: '0.1s' }}
            >
              A new home for independent creators
            </div>

            {/* Headline — char-by-char 3D reveal + glow sweep on "connect" */}
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl lg:text-8xl">
              {headlineChars.map((char, i) => {
                const isSpace = char === ' ';
                const isConnect = i >= connectStart && i < connectStart + 'connect'.length;

                return (
                  <span
                    key={i}
                    className="inline-block overflow-hidden align-bottom"
                    style={{ width: isSpace ? '0.3em' : undefined }}
                  >
                    <span
                      className={`char-reveal ${isConnect ? 'glow-text' : ''}`}
                      style={{ animationDelay: `${0.3 + i * 0.035}s` }}
                    >
                      {isSpace ? '\u00A0' : char}
                    </span>
                  </span>
                );
              })}
            </h1>

            {/* Subtitle */}
            <p
              className="fade-up mt-8 max-w-xl text-lg leading-relaxed text-neutral-400"
              style={{ animationDelay: '1.4s' }}
            >
              Upload your original music and art. Discover new creators. Like, subscribe, and support the artists you love.
            </p>

            {/* Buttons */}
            <div className="fade-up mt-10 flex flex-wrap gap-3" style={{ animationDelay: '1.55s' }}>
              {user ? (
                <Link
                  to="/upload"
                  className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
                >
                  <span className="shimmer-bar absolute inset-0 overflow-hidden rounded-xl" />
                  <Upload className="relative h-4 w-4" />
                  <span className="relative">Upload your work</span>
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
                >
                  <span className="shimmer-bar absolute inset-0 overflow-hidden rounded-xl" />
                  <span className="relative">Get started free</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              <Link
                to="/browse/music"
                className="flex items-center gap-2 rounded-xl border border-neutral-700 px-7 py-3.5 text-sm font-semibold text-neutral-200 transition-all hover:border-neutral-600 hover:bg-neutral-900 hover:-translate-y-0.5"
              >
                <Music className="h-4 w-4" />
                Browse music
              </Link>
            </div>

            {user && profile?.is_artist && (
              <p className="fade-up mt-5 text-sm text-orange-400" style={{ animationDelay: '1.7s' }}>
                Artist Mode is on — you can upload content.
              </p>
            )}
          </div>
        </div>

        {/* Animated SVG wave divider */}
        <svg
          className="pointer-events-none absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 120"
          fill="none"
          preserveAspectRatio="none"
          style={{ height: '80px' }}
        >
          <path
            d="M0,60 C240,100 480,20 720,50 C960,80 1200,100 1440,50 L1440,120 L0,120 Z"
            fill="#0a0a0a"
            className="mesh-anim"
          />
        </svg>

        {/* Scroll indicator */}
        <div className="absolute bottom-24 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex">
          <span className="text-xs text-neutral-600">Scroll</span>
          <div className="flex h-9 w-5.5 justify-center rounded-full border border-neutral-700 p-1">
            <div className="h-2 w-1 animate-bounce rounded-full bg-orange-400" />
          </div>
        </div>
      </section>

      {/* ===== Stat strip ===== */}
      <section className="overflow-hidden border-b border-neutral-800 bg-neutral-900/30 py-4">
        <div className="flex whitespace-nowrap">
          <div className="marquee-track flex shrink-0 items-center gap-12 pr-12 text-sm font-medium text-neutral-500">
            {[
              { icon: Music, label: 'Original Music' },
              { icon: Image, label: 'Original Art' },
              { icon: Heart, label: 'Like & Discover' },
              { icon: Users, label: 'Subscribe to Artists' },
              { icon: Trophy, label: 'Top 10 Leaderboard' },
              { icon: Sparkles, label: 'Built for Creators' },
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-orange-400/70" />
                {item.label}
                <span className="ml-12 text-neutral-700">/</span>
              </span>
            ))}
          </div>
          <div className="marquee-track flex shrink-0 items-center gap-12 pr-12 text-sm font-medium text-neutral-500" aria-hidden>
            {[
              { icon: Music, label: 'Original Music' },
              { icon: Image, label: 'Original Art' },
              { icon: Heart, label: 'Like & Discover' },
              { icon: Users, label: 'Subscribe to Artists' },
              { icon: Trophy, label: 'Top 10 Leaderboard' },
              { icon: Sparkles, label: 'Built for Creators' },
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-orange-400/70" />
                {item.label}
                <span className="ml-12 text-neutral-700">/</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Latest Music ===== */}
      <section ref={musicRef} className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="reveal mb-8 flex items-center justify-between" data-reveal>
          <h2 className="flex items-center gap-2.5 text-2xl font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15">
              <Music className="h-5 w-5 text-orange-400" />
            </span>
            Latest Music
          </h2>
          <Link to="/browse/music" className="group flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200">
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {musicLoading ? (
          <LoadingState />
        ) : musicItems.length === 0 ? (
          <EmptyState title="No music yet" message="Be the first to upload a track." action={<Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">Upload</Link>} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {musicItems.map((item, i) => (
              <div key={item.id} className="reveal" data-reveal data-reveal-delay={i * 80}>
                <div className="card-lift h-full rounded-xl border border-neutral-800 bg-neutral-900 hover:border-neutral-700 hover:shadow-lg hover:shadow-black/20">
                  <ContentCard item={item} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Latest Art ===== */}
      <section ref={artRef} className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="reveal mb-8 flex items-center justify-between" data-reveal>
          <h2 className="flex items-center gap-2.5 text-2xl font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/15">
              <Image className="h-5 w-5 text-pink-400" />
            </span>
            Latest Art
          </h2>
          <Link to="/browse/art" className="group flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200">
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {artLoading ? (
          <LoadingState />
        ) : artItems.length === 0 ? (
          <EmptyState title="No art yet" message="Be the first to upload artwork." action={<Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">Upload</Link>} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {artItems.map((item, i) => (
              <div key={item.id} className="reveal" data-reveal data-reveal-delay={i * 80}>
                <div className="card-lift h-full rounded-xl border border-neutral-800 bg-neutral-900 hover:border-neutral-700 hover:shadow-lg hover:shadow-black/20">
                  <ContentCard item={item} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Leaderboard CTA ===== */}
      <section ref={ctaRef} className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="reveal" data-reveal>
          <Link to="/leaderboard" className="group block">
            <div className="scale-in relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-900/50 p-8 transition-all hover:border-neutral-700">
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl transition-opacity group-hover:opacity-70" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-110">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Top 10 Leaderboard</h3>
                    <p className="mt-0.5 text-sm text-neutral-400">See the most-loved artists on Kreatif</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-neutral-400 transition-all group-hover:translate-x-1 group-hover:text-white" />
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

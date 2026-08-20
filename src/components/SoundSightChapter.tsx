import { Link } from 'react-router-dom';

/**
 * Side-by-side Sound | Sight gateway.
 * Click “Music” or “Art” to enter each world — no extra buttons.
 */
export function SoundSightChapter() {
  return (
    <section
      className="relative border-y border-white/[0.06]"
      aria-label="Sound and Sight"
    >
      <div className="grid min-h-[min(52vh,420px)] grid-cols-1 md:grid-cols-2">
        {/* Music — left */}
        <Link
          to="/browse/music"
          className="group relative flex flex-col items-center justify-center border-b border-white/[0.06] px-6 py-16 transition-colors hover:bg-orange-500/[0.04] md:border-b-0 md:border-r md:border-white/[0.06] md:py-20"
        >
          <p className="label-caps mb-4 text-orange-400/50 transition-colors group-hover:text-orange-400/80">
            Sound
          </p>
          <h2 className="text-center text-5xl tracking-tight text-white transition-transform duration-500 group-hover:scale-[1.03] sm:text-6xl lg:text-7xl">
            <span className="font-musicnet not-italic text-orange-300 group-hover:text-orange-200">
              Music
            </span>
          </h2>
          <p className="mt-4 max-w-[14rem] text-center text-sm text-neutral-500 transition-colors group-hover:text-neutral-400">
            Original tracks from the community
          </p>
        </Link>

        {/* Art — right */}
        <Link
          to="/browse/art"
          className="group relative flex flex-col items-center justify-center px-6 py-16 transition-colors hover:bg-pink-500/[0.04] md:py-20"
        >
          <p className="label-caps mb-4 text-pink-400/50 transition-colors group-hover:text-pink-400/80">
            Sight
          </p>
          <h2 className="text-center text-5xl tracking-tight text-white transition-transform duration-500 group-hover:scale-[1.03] sm:text-6xl lg:text-7xl">
            <span className="font-arthure not-italic text-pink-300 group-hover:text-pink-200">
              Art
            </span>
          </h2>
          <p className="mt-4 max-w-[14rem] text-center text-sm text-neutral-500 transition-colors group-hover:text-neutral-400">
            Visual work from independent creators
          </p>
        </Link>
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-500">
              <Music className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Kreatif</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-400">
            <Link to="/browse/music" className="hover:text-neutral-200">
              Browse Music
            </Link>
            <Link to="/browse/art" className="hover:text-neutral-200">
              Browse Art
            </Link>
            <Link to="/leaderboard" className="hover:text-neutral-200">
              Leaderboard
            </Link>
            <Link to="/terms" className="hover:text-neutral-200">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-neutral-200">
              Privacy
            </Link>
          </nav>
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} Kreatif. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

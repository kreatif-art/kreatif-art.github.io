import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <img src="/logo.png?v=3" alt="" className="h-6 w-6 rounded-sm object-cover" />
            Kreatif
          </Link>
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
            <Link to="/how-to-upload" className="hover:text-neutral-200">
              How to upload
            </Link>
            <Link to="/pro" className="hover:text-neutral-200">
              Artist Pro
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

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, Image, Trophy, Upload, LogOut, Menu, X, Home, User, ListMusic } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { cn, getInitials } from '@/lib/utils';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { currentTrack } = usePlayer();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/browse/music', label: 'Music', icon: Music },
    { to: '/browse/art', label: 'Art', icon: Image },
    { to: '/leaderboard', label: 'Top 10', icon: Trophy },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-white">Kreatif</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200',
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {profile?.is_artist && (
                <Link
                  to="/upload"
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Link>
              )}
              <Link
                to="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold text-neutral-200 ring-2 ring-transparent transition-all hover:ring-neutral-600"
                title={profile?.display_name || 'Profile'}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  getInitials(profile?.display_name || 'U')
                )}
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-neutral-300 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200',
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                {profile?.is_artist && (
                  <Link
                    to="/upload"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Link>
                )}
                <Link
                  to="/collections"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                >
                  <ListMusic className="h-4 w-4" />
                  Collections
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-neutral-900"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
      {/* Spacer when mini player visible — optional reserved for layout */}
      {currentTrack ? null : null}
    </header>
  );
}

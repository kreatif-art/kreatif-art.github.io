import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Music, Image, Trophy, Upload, User, LogOut, Menu, X, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { cn, getInitials } from '@/lib/utils';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { currentTrack } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-500">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Kreatif</span>
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
          <form onSubmit={handleSearch} className="hidden sm:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-40 rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 transition-all focus:w-56 focus:border-neutral-600 focus:outline-none"
              />
            </div>
          </form>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/upload"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Link>
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
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-4 md:hidden">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
              />
            </div>
          </form>
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
                <Link
                  to="/upload"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                >
                  <Upload className="h-4 w-4" />
                  Upload
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
              <div className="mt-2 flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 rounded-lg border border-neutral-700 px-4 py-2 text-center text-sm font-medium text-neutral-200"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 rounded-lg bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-900"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

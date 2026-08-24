import { Link, useLocation } from 'react-router-dom';
import { Home, Music, Image, ListMusic, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { to: '/browse/music', label: 'Music', icon: Music, match: (p: string) => p.startsWith('/browse/music') },
  { to: '/browse/art', label: 'Art', icon: Image, match: (p: string) => p.startsWith('/browse/art') },
  { to: '/collections', label: 'Saved', icon: ListMusic, match: (p: string) => p.startsWith('/collections') },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { currentTrack } = usePlayer();
  const profileTo = user ? '/profile' : '/login';

  return (
    <nav
      className={cn(
        'mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-neutral-950/95 backdrop-blur-xl md:hidden',
        currentTrack && 'mobile-bottom-nav--with-player',
      )}
      aria-label="Primary"
    >
      <div
        className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1"
        style={{ paddingBottom: 'max(0.35rem, var(--safe-bottom))' }}
      >
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(location.pathname);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors',
                active ? 'text-orange-300' : 'text-neutral-500 hover:text-neutral-300',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.25]')} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <Link
          to={profileTo}
          className={cn(
            'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors',
            location.pathname.startsWith('/profile') || location.pathname === '/login'
              ? 'text-orange-300'
              : 'text-neutral-500 hover:text-neutral-300',
          )}
        >
          <User className="h-5 w-5" />
          <span className="truncate">{user ? 'You' : 'Sign in'}</span>
        </Link>
      </div>
    </nav>
  );
}

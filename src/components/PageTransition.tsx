import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Coveo-inspired page transition: brief fade + slight rise on route change.
 * Wraps page content only — does not touch auth, data, or handlers.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [display, setDisplay] = useState(children);
  const [path, setPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname === path) {
      setDisplay(children);
      return;
    }
    setPhase('out');
    const t = window.setTimeout(() => {
      setDisplay(children);
      setPath(location.pathname);
      setPhase('in');
    }, 220);
    return () => clearTimeout(t);
  }, [location.pathname, children, path]);

  return (
    <div
      className={
        phase === 'in'
          ? 'page-transition page-transition--in'
          : 'page-transition page-transition--out'
      }
    >
      {display}
    </div>
  );
}

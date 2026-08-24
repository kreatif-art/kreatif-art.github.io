import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[60] border-b border-amber-500/30 bg-amber-950/95 px-3 py-2 text-center text-xs text-amber-100 backdrop-blur-md"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      role="status"
    >
      <span className="inline-flex items-center gap-2">
        <WifiOff className="h-3.5 w-3.5" />
        You&apos;re offline — shell and recently viewed catalog may still work. Live tips and uploads need a connection.
      </span>
    </div>
  );
}

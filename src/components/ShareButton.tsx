import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
  label?: string;
};

/** Web Share API with clipboard fallback — for artist/work links off-platform */
export function ShareButton({ title, text, url, className, label = 'Share' }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const href = url || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: title || document.title, text, url: href });
        return;
      }
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-white/30 hover:text-white',
        className,
      )}
    >
      <Share2 className="h-4 w-4" />
      {copied ? 'Copied' : label}
    </button>
  );
}

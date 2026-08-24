import { useEffect } from 'react';
import { X } from 'lucide-react';

export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black"
      style={{ height: '100dvh', width: '100vw', maxHeight: '100dvh' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 z-10 rounded-full bg-white/15 p-2 text-neutral-100 backdrop-blur-sm hover:bg-white/25"
        style={{ top: 'max(0.75rem, var(--safe-top))' }}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="absolute inset-x-0 flex items-center justify-center"
        style={{
          top: 'calc(var(--safe-top) + 3rem)',
          bottom: 'calc(var(--safe-bottom) + 0.75rem)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="select-none"
          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

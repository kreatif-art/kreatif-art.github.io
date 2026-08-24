import { useEffect, useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const apply = () => {
      const vv = window.visualViewport;
      const h = vv?.height ?? window.innerHeight;
      const offsetTop = vv?.offsetTop ?? 0;

      let safeTop = 0;
      let safeBottom = 0;
      try {
        const cs = getComputedStyle(document.documentElement);
        safeTop = parseFloat(cs.getPropertyValue('--safe-top')) || 0;
        safeBottom = parseFloat(cs.getPropertyValue('--safe-bottom')) || 0;
      } catch {
        /* ignore */
      }

      root.style.position = 'fixed';
      root.style.top = `${offsetTop}px`;
      root.style.left = '0';
      root.style.right = '0';
      root.style.bottom = 'auto';
      root.style.height = `${h}px`;
      root.style.width = '100%';
      root.style.zIndex = '60';

      stage.style.position = 'absolute';
      stage.style.top = `${safeTop + 48}px`;
      stage.style.bottom = `${safeBottom + 12}px`;
      stage.style.left = '0';
      stage.style.right = '0';
    };

    apply();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);
    return () => {
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
    };
  }, []);

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
      ref={rootRef}
      className="bg-black"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 z-10 rounded-full bg-white/15 p-2 text-neutral-100 backdrop-blur-sm hover:bg-white/25"
        style={{ top: 'max(0.75rem, var(--safe-top, 0px))' }}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        ref={stageRef}
        className="overflow-hidden"
        style={{ display: 'grid', placeItems: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="select-none"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
            margin: 0,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

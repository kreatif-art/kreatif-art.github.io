/** Set document title + Open Graph / Twitter tags for shareable moments */

export function setShareMeta(opts: {
  title: string;
  description: string;
  url?: string;
  image?: string | null;
}) {
  if (typeof document === 'undefined') return;

  document.title = opts.title;

  const ensure = (attr: 'name' | 'property', key: string, content: string) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  const url = opts.url || (typeof window !== 'undefined' ? window.location.href : 'https://kreatif-art.github.io/');
  const image = opts.image || 'https://kreatif-art.github.io/logo.png';

  ensure('name', 'description', opts.description);
  ensure('property', 'og:title', opts.title);
  ensure('property', 'og:description', opts.description);
  ensure('property', 'og:type', 'website');
  ensure('property', 'og:url', url);
  ensure('property', 'og:image', image);
  ensure('property', 'og:site_name', 'Kreatif');
  ensure('property', 'og:locale', 'en_US');
  ensure('name', 'twitter:card', 'summary_large_image');
  ensure('name', 'twitter:site', '@kreatif');
  ensure('name', 'twitter:title', opts.title);
  ensure('name', 'twitter:description', opts.description);
  ensure('name', 'twitter:image', image);
}

export function resetShareMeta() {
  setShareMeta({
    title: 'Kreatif — Sight & Sound',
    description: 'Original music and visual art on one stage. Discover pairs, support indie makers. Sight & Sound — Kreatif.',
    url: 'https://kreatif-art.github.io/',
  });
}

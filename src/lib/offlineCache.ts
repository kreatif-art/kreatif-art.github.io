/** Cache recent catalog snapshots for offline browsing */

const CATALOG_KEY = 'kreatif-offline-catalog-v1';
const MAX_ITEMS = 80;

export type OfflineCatalog = {
  savedAt: number;
  music: unknown[];
  art: unknown[];
  pairs: unknown[];
};

export function saveOfflineCatalog(partial: Partial<OfflineCatalog>) {
  try {
    const prev = loadOfflineCatalog();
    const next: OfflineCatalog = {
      savedAt: Date.now(),
      music: (partial.music || prev?.music || []).slice(0, MAX_ITEMS),
      art: (partial.art || prev?.art || []).slice(0, MAX_ITEMS),
      pairs: (partial.pairs || prev?.pairs || []).slice(0, MAX_ITEMS),
    };
    localStorage.setItem(CATALOG_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function loadOfflineCatalog(): OfflineCatalog | null {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineCatalog;
  } catch {
    return null;
  }
}

export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

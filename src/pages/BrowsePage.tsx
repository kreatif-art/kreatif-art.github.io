import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useContent, useGenres } from '@/hooks/useContent';
import { ContentCard } from '@/components/ContentCard';
import { HorizontalRail } from '@/components/HorizontalRail';
import { LoadingState, EmptyState, ErrorState } from '@/components/States';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

type SearchScope = 'title' | 'artist';

export function BrowsePage({ type }: { type: 'music' | 'art' }) {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const genreId = searchParams.get('genre') || null;
  const qParam = searchParams.get('q') || '';
  const scopeParam = (searchParams.get('scope') as SearchScope) || 'title';

  const [query, setQuery] = useState(qParam);
  const [scope, setScope] = useState<SearchScope>(scopeParam === 'artist' ? 'artist' : 'title');

  useEffect(() => {
    setQuery(qParam);
    setScope(scopeParam === 'artist' ? 'artist' : 'title');
  }, [qParam, scopeParam]);

  const { genres } = useGenres(type);
  const isMusic = type === 'music';

  const activeSearch = qParam.trim();
  const { items, loading, error, hasMore, loadMore, refetch } = useContent({
    type,
    genreId,
    search: activeSearch || undefined,
    searchScope: scopeParam === 'artist' ? 'artist' : 'title',
  });

  const titleLabel = isMusic ? 'Track name' : 'Art name';
  const placeholder =
    scope === 'artist'
      ? 'Search artists…'
      : isMusic
        ? 'Search tracks…'
        : 'Search artworks…';

  const applySearch = (nextQ: string, nextScope: SearchScope, nextGenre: string | null) => {
    const params: Record<string, string> = {};
    if (nextGenre) params.genre = nextGenre;
    if (nextQ.trim()) {
      params.q = nextQ.trim();
      params.scope = nextScope;
    }
    setSearchParams(params);
  };

  const setGenre = (id: string | null) => {
    applySearch(query, scope, id);
  };

  const onSubmitSearch = (e: FormEvent) => {
    e.preventDefault();
    applySearch(query, scope, genreId);
  };

  const emptyMessage = useMemo(() => {
    if (activeSearch && genreId) {
      return `No matches for “${activeSearch}” in this genre. Try another genre or search target.`;
    }
    if (activeSearch) {
      return `No matches for “${activeSearch}”. Try a different name or switch Artists / ${titleLabel}.`;
    }
    if (genreId) return 'No content in this genre yet. Try another genre or upload your own.';
    return 'Be the first to upload.';
  }, [activeSearch, genreId, titleLabel]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl px-4 pt-5 pb-3 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-caps mb-2 text-neutral-500">
              {isMusic ? 'Sound' : 'Sight'}
            </p>
            <h1 className="text-4xl tracking-tight text-white sm:text-5xl">
              Browse{' '}
              {isMusic ? (
                <span className="font-musicnet not-italic text-orange-300">Music</span>
              ) : (
                <span className="font-arthure not-italic text-pink-300/90">Art</span>
              )}
            </h1>
            <p className="mt-1.5 text-[13px] text-neutral-500">Filter by genre, then search</p>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <Link
              to="/browse/music"
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                isMusic ? 'bg-white text-neutral-900' : 'text-neutral-400 hover:text-white',
              )}
            >
              <span className={cn(isMusic && 'font-musicnet')}>Music</span>
            </Link>
            <Link
              to="/browse/art"
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                !isMusic ? 'bg-white text-neutral-900' : 'text-neutral-400 hover:text-white',
              )}
            >
              <span className={cn(!isMusic && 'font-arthure')}>Art</span>
            </Link>
          </div>
        </div>

        {/* Genre first */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGenre(null)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              !genreId
                ? 'bg-white text-neutral-900'
                : 'border border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200',
            )}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => setGenre(genreId === genre.id ? null : genre.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                genreId === genre.id
                  ? 'bg-white text-neutral-900'
                  : 'border border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200',
              )}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {/* Search below genre — scope dropdown + field */}
        <form onSubmit={onSubmitSearch} className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] focus-within:border-white/25">
            <label className="sr-only" htmlFor="browse-scope">
              Search in
            </label>
            <select
              id="browse-scope"
              value={scope}
              onChange={(e) => {
                const next = e.target.value as SearchScope;
                setScope(next);
                if (query.trim()) applySearch(query, next, genreId);
              }}
              className="shrink-0 border-r border-white/10 bg-transparent py-2.5 pl-4 pr-2 text-sm text-neutral-300 outline-none"
            >
              <option value="title" className="bg-neutral-900 text-white">
                {titleLabel}
              </option>
              <option value="artist" className="bg-neutral-900 text-white">
                Artists
              </option>
            </select>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition-opacity hover:opacity-90"
          >
            Search
          </button>
          {activeSearch ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                applySearch('', scope, genreId);
              }}
              className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          ) : null}
        </form>
        <p className="mb-4 text-[11px] text-neutral-600">
          Searching {scope === 'artist' ? 'artists' : titleLabel.toLowerCase()}
          {genreId ? ' within selected genre' : ''}
        </p>
      </div>

      {error ? (
        <div className="px-4">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      ) : loading && items.length === 0 ? (
        <div className="px-4">
          <LoadingState />
        </div>
      ) : items.length === 0 ? (
        <div className="px-4">
          <EmptyState
            title={activeSearch ? 'No results' : `No ${isMusic ? 'music' : 'art'} yet`}
            message={emptyMessage}
            action={
              profile?.is_artist ? (
                <Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">
                  Upload
                </Link>
              ) : user ? (
                <Link to="/profile" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">
                  Enable artist mode to upload
                </Link>
              ) : (
                <Link to="/signup" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">
                  Join to share work
                </Link>
              )
            }
          />
        </div>
      ) : (
        <>
          <HorizontalRail tone={isMusic ? 'music' : 'art'} sideLabel={isMusic ? 'MUSIC' : 'ART'}>
            {items.map((item) => (
              <div key={item.id} className="rail-card">
                <ContentCard item={item} />
              </div>
            ))}
          </HorizontalRail>

          {hasMore && (
            <div className="mt-6 flex justify-center pb-10">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="rounded-full border border-white/15 px-5 py-2 text-sm text-neutral-300 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Load more into the reel'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

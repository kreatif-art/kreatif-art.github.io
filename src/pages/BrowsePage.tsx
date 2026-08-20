import { useSearchParams, Link } from 'react-router-dom';
import { Music, Image } from 'lucide-react';
import { useContent, useGenres } from '@/hooks/useContent';
import { ContentCard } from '@/components/ContentCard';
import { HorizontalRail } from '@/components/HorizontalRail';
import { LoadingState, EmptyState, ErrorState } from '@/components/States';
import { cn } from '@/lib/utils';

export function BrowsePage({ type }: { type: 'music' | 'art' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const genreId = searchParams.get('genre') || null;
  const { genres } = useGenres(type);
  const { items, loading, error, hasMore, loadMore, refetch } = useContent({ type, genreId });

  const isMusic = type === 'music';

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-4 sm:px-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-caps mb-2 text-neutral-500">
              {isMusic ? 'Scroll into sound' : 'Scroll into sight'}
            </p>
            <h1 className="text-4xl tracking-tight text-white sm:text-5xl">
              Browse{' '}
              {isMusic ? (
                <span className="font-musicnet not-italic text-orange-300">Music</span>
              ) : (
                <span className="font-arthure not-italic text-pink-300/90">Art</span>
              )}
            </h1>
            <p className="mt-2 text-sm text-neutral-500">Newest first · drag or scroll the reel</p>
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

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSearchParams({})}
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
              onClick={() => setSearchParams(genreId === genre.id ? {} : { genre: genre.id })}
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
            title={`No ${isMusic ? 'music' : 'art'} yet`}
            message={
              genreId
                ? 'No content in this genre yet. Try another genre or upload your own.'
                : 'Be the first to upload.'
            }
            action={
              <Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">
                Upload
              </Link>
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

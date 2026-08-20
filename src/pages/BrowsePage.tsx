import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Music, Image } from 'lucide-react';
import { useContent, useGenres } from '@/hooks/useContent';
import { ContentCard } from '@/components/ContentCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/States';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function BrowsePage({ type }: { type: 'music' | 'art' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const genreId = searchParams.get('genre') || null;
  const { genres } = useGenres(type);
  const { items, loading, error, hasMore, loadMore, refetch } = useContent({ type, genreId });

  const isMusic = type === 'music';
  const otherType = isMusic ? 'art' : 'music';

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', isMusic ? 'bg-orange-500/20' : 'bg-pink-500/20')}>
              {isMusic ? <Music className="h-5 w-5 text-orange-400" /> : <Image className="h-5 w-5 text-pink-400" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{isMusic ? 'Browse Music' : 'Browse Art'}</h1>
              <p className="text-sm text-neutral-400">Sorted by newest</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-800 p-1">
            <Link
              to="/browse/music"
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isMusic ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200',
              )}
            >
              <Music className="h-3.5 w-3.5" /> Music
            </Link>
            <Link
              to="/browse/art"
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                !isMusic ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200',
              )}
            >
              <Image className="h-3.5 w-3.5" /> Art
            </Link>
          </div>
        </div>

        {/* Genre filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              !genreId ? 'bg-white text-neutral-900' : 'border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200',
            )}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSearchParams(genreId === genre.id ? {} : { genre: genre.id })}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                genreId === genre.id ? 'bg-white text-neutral-900' : 'border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200',
              )}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading && items.length === 0 ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title={`No ${isMusic ? 'music' : 'art'} yet`}
            message={genreId ? 'No content in this genre yet. Try another genre or upload your own.' : 'Be the first to upload.'}
            action={<Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">Upload</Link>}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {items.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="rounded-lg border border-neutral-700 px-6 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

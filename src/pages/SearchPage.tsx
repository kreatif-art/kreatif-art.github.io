import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { ContentCard } from '@/components/ContentCard';
import { LoadingState, EmptyState } from '@/components/States';
import { useState } from 'react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);

  const { items, loading, error, hasMore, loadMore } = useContent({ search: query });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setSearchParams({ q: input.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-white">Search</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 pl-12 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
            />
          </div>
        </form>

        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : !query ? (
          <EmptyState title="Search for content" message="Type a title or keyword to find music and art on Kreatif." />
        ) : loading && items.length === 0 ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState title={`No results for "${query}"`} message="Try different keywords or check your spelling." />
        ) : (
          <>
            <p className="mb-4 text-sm text-neutral-400">
              {items.length}+ result{items.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
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

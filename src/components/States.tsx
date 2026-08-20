import { cn } from '@/lib/utils';

export function LoadingState({ message = 'Loading...', className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-300" />
      <p className="mt-4 text-sm text-neutral-400">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-800 py-16 px-4 text-center">
      <h3 className="text-lg font-semibold text-neutral-200">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-neutral-400">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-900/50 bg-red-950/20 py-16 px-4 text-center">
      <p className="text-sm text-red-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

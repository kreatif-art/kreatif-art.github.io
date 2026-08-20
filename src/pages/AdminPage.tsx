import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LoadingState, EmptyState, ErrorState } from '@/components/States';
import { getInitials, formatRelativeTime, cn } from '@/lib/utils';
import { Shield, Eye, EyeOff, Trash2, Check, X, Flag } from 'lucide-react';
import type { Report, ContentItem, Profile } from '@/types';

interface ReportWithRelations extends Report {
  profiles: Profile;
  content: ContentItem & { profiles: Profile };
}

export function AdminPage() {
  const [reports, setReports] = useState<ReportWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('reports')
      .select(`
        id, reporter_id, content_id, reason, status, created_at, resolved_at,
        profiles!reports_reporter_id_fkey (id, display_name, avatar_url, email),
        content!reports_content_id_fkey (
          id, user_id, type, title, description, file_url, cover_image_url, visibility, created_at,
          profiles!content_user_id_fkey (id, display_name, avatar_url, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (filter === 'pending') query = query.eq('status', 'pending');
    else if (filter === 'resolved') query = query.in('status', ['resolved', 'dismissed']);

    const { data, error: queryError } = await query;

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setReports((data || []) as unknown as ReportWithRelations[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleHide = async (contentId: string) => {
    const { error } = await supabase.from('content').update({ visibility: 'hidden' }).eq('id', contentId);
    if (error) {
      setError(error.message);
      return;
    }
    fetchReports();
  };

  const handleShow = async (contentId: string) => {
    const { error } = await supabase.from('content').update({ visibility: 'visible' }).eq('id', contentId);
    if (error) {
      setError(error.message);
      return;
    }
    fetchReports();
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Delete this content permanently? This cannot be undone.')) return;
    const { error } = await supabase.from('content').delete().eq('id', contentId);
    if (error) {
      setError(error.message);
      return;
    }
    fetchReports();
  };

  const handleResolve = async (reportId: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', reportId);
    if (error) {
      setError(error.message);
      return;
    }
    fetchReports();
  };

  const handleDismiss = async (reportId: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
      .eq('id', reportId);
    if (error) {
      setError(error.message);
      return;
    }
    fetchReports();
  };

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Moderation</h1>
            <p className="text-sm text-neutral-400">Review reported content</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {(['pending', 'resolved', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                filter === f ? 'bg-white text-neutral-900' : 'border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {error && <ErrorState message={error} onRetry={fetchReports} />}

        {loading ? (
          <LoadingState />
        ) : reports.length === 0 ? (
          <EmptyState title="No reports" message={filter === 'pending' ? 'No pending reports to review.' : 'No reports in this category.'} />
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const content = report.content;
              const artist = content.profiles;
              const isHidden = content.visibility === 'hidden';

              return (
                <div key={report.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  {/* Report info */}
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Flag className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-sm font-semibold text-red-300">{report.reason}</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        Reported by {report.profiles.display_name} &middot; {formatRelativeTime(report.created_at)}
                      </p>
                    </div>
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                      'bg-neutral-700 text-neutral-400',
                    )}>
                      {report.status}
                    </span>
                  </div>

                  {/* Content preview */}
                  <div className="flex gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-800">
                      {content.type === 'art' ? (
                        <img src={content.file_url} alt="" className="h-full w-full object-cover" />
                      ) : content.cover_image_url ? (
                        <img src={content.cover_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-600">
                          <span className="text-xs">{content.type}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-200">{content.title}</p>
                      <p className="truncate text-xs text-neutral-500">by {artist.display_name}</p>
                      {content.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{content.description}</p>
                      )}
                      {isHidden && (
                        <span className="mt-1 inline-block rounded bg-neutral-700 px-1.5 py-0.5 text-xs text-neutral-300">Hidden</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {report.status === 'pending' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isHidden ? (
                        <button onClick={() => handleShow(content.id)} className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">
                          <Eye className="h-3.5 w-3.5" /> Unhide
                        </button>
                      ) : (
                        <button onClick={() => handleHide(content.id)} className="flex items-center gap-1.5 rounded-lg border border-yellow-900/50 bg-yellow-950/20 px-3 py-1.5 text-xs font-medium text-yellow-300 hover:bg-yellow-900/30">
                          <EyeOff className="h-3.5 w-3.5" /> Hide
                        </button>
                      )}
                      <button onClick={() => handleDelete(content.id)} className="flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/30">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                      <button onClick={() => handleResolve(report.id)} className="flex items-center gap-1.5 rounded-lg border border-green-900/50 bg-green-950/20 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-900/30">
                        <Check className="h-3.5 w-3.5" /> Resolve
                      </button>
                      <button onClick={() => handleDismiss(report.id)} className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800">
                        <X className="h-3.5 w-3.5" /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

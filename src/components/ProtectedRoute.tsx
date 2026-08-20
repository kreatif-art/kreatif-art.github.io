import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/States';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState message="Checking your session..." className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingState message="Checking admin access..." className="min-h-screen" />;
  if (!profile || profile.email !== 'admin@kreatif.app') return <Navigate to="/" replace />;

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState message="Loading..." className="min-h-screen" />;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export { Link };

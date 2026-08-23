import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo } from '@/components/BrandLogo';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await resetPassword(email);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <BrandLogo className="h-16 w-16 rounded-2xl ring-1 ring-white/10" />
          <h1 className="mt-4 text-2xl font-bold text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-neutral-400">We&apos;ll email you a secure reset link</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <p className="mt-4 text-sm text-neutral-300">
              If an account exists for <span className="text-white">{email}</span>, you&apos;ll receive a reset
              link shortly.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-neutral-900 hover:opacity-90"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-3 text-sm text-neutral-200 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-400">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-orange-400 hover:text-orange-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

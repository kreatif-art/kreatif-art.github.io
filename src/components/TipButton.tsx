import { useMemo, useState } from 'react';
import { HeartHandshake, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PLATFORM_TIP_FEE_RATE } from '@/types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const PRESETS = [300, 500, 1000, 2000]; // cents

type Props = {
  artistId: string;
  artistName: string;
  contentId?: string;
  className?: string;
};

export function TipButton({ artistId, artistName, contentId, className }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amountCents, setAmountCents] = useState(500);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const fee = useMemo(() => Math.max(1, Math.round(amountCents * PLATFORM_TIP_FEE_RATE)), [amountCents]);
  const artistGets = amountCents - fee;

  const submit = async () => {
    if (!user) return;
    if (user.id === artistId) {
      setError("You can't tip yourself.");
      return;
    }
    if (amountCents < 100) {
      setError('Minimum tip is $1.00');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc('record_tip', {
      p_to_user_id: artistId,
      p_content_id: contentId ?? null,
      p_amount_cents: amountCents,
      p_message: message.trim() || null,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setDone(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError(null);
        }}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-100 transition-colors hover:bg-orange-500/20',
          className,
        )}
      >
        <HeartHandshake className="h-4 w-4" />
        Tip
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-neutral-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {!user ? (
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-medium text-white">Sign in to tip</h3>
                <p className="text-sm text-neutral-400">Support {artistName} with a tip. Platform fee is 10%.</p>
                <Link to="/login" className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-medium text-neutral-900">
                  Log in
                </Link>
              </div>
            ) : done ? (
              <div className="space-y-3 text-center">
                <h3 className="text-lg font-medium text-white">Thank you</h3>
                <p className="text-sm text-neutral-400">
                  ${(amountCents / 100).toFixed(2)} sent. {artistName} receives ${(artistGets / 100).toFixed(2)} (10% platform fee).
                </p>
                <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-white px-5 py-2 text-sm font-medium text-neutral-900">
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-medium text-white">Tip {artistName}</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Free to use Kreatif. Platform only earns when you tip — <span className="text-neutral-300">10% fee</span>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAmountCents(c)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        amountCents === c ? 'bg-white text-neutral-900' : 'border border-white/15 text-neutral-300 hover:text-white',
                      )}
                    >
                      ${(c / 100).toFixed(0)}
                    </button>
                  ))}
                </div>

                <label className="block text-xs text-neutral-500">
                  Custom amount (USD)
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={amountCents / 100}
                    onChange={(e) => setAmountCents(Math.max(1, Math.round(Number(e.target.value) * 100)))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                  />
                </label>

                <label className="block text-xs text-neutral-500">
                  Note (optional)
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={140}
                    placeholder="Loved this piece"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                  />
                </label>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs text-neutral-400">
                  <div className="flex justify-between">
                    <span>You pay</span>
                    <span className="text-white">${(amountCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span>Platform (10%)</span>
                    <span>${(fee / 100).toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-white/[0.06] pt-1">
                    <span>Artist receives</span>
                    <span className="text-orange-200">${(artistGets / 100).toFixed(2)}</span>
                  </div>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="button"
                  disabled={busy}
                  onClick={submit}
                  className="w-full rounded-full bg-white py-2.5 text-sm font-medium text-neutral-900 disabled:opacity-50"
                >
                  {busy ? 'Sending…' : `Send $${(amountCents / 100).toFixed(2)} tip`}
                </button>
                <p className="text-[10px] leading-relaxed text-neutral-600">
                  Beta: tips are recorded on-platform with the 10% split. Stripe payouts can be connected next so balances move to bank accounts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

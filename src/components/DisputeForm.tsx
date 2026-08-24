import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

type Existing = {
  id: string;
  title: string;
  type: string;
  artist_name: string;
};

type Props = {
  fingerprint: string;
  existing: Existing;
  onDone?: () => void;
};

export function DisputeForm({ fingerprint, existing, onDone }: Props) {
  const [note, setNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const { data, error } = await supabase.rpc('submit_content_dispute', {
        p_existing_content_id: existing.id,
        p_fingerprint: fingerprint,
        p_claim_note: note,
        p_proof_url: proofUrl || null,
      });
      if (error) throw error;
      setMsg(`Dispute submitted (ref ${String(data).slice(0, 8)}…). An admin will review.`);
      onDone?.();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Could not submit dispute');
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
      <p className="text-sm text-amber-100/90">
        This file matches <strong>{existing.title}</strong> by <strong>{existing.artist_name}</strong>. You
        cannot publish a duplicate. If you believe you own this work, file a dispute with proof.
      </p>
      <label className="block text-xs text-neutral-400">
        Why this work is yours (min 20 characters)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
          minLength={20}
          rows={4}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          placeholder="Explain ownership, creation date, links to your portfolio, registration numbers…"
        />
      </label>
      <label className="block text-xs text-neutral-400">
        Proof link (optional — portfolio, registry, Drive folder)
        <input
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          type="url"
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          placeholder="https://"
        />
      </label>
      {err && <p className="text-xs text-red-400">{err}</p>}
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}
      <button
        type="submit"
        disabled={busy || note.trim().length < 20}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit dispute challenge
      </button>
    </form>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useContent } from '@/hooks/useContent';
import { ContentCard } from '@/components/ContentCard';
import { LoadingState, EmptyState } from '@/components/States';
import { getInitials, cn } from '@/lib/utils';
import { Music, Image, Upload, LogOut, Camera, Loader2, Check, Star, BarChart3, BadgeCheck, Banknote } from 'lucide-react';
import { FREE_UPLOADS_PER_MONTH } from '@/types';

export function ProfilePage() {
  const { user, profile, updateProfile, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [tab, setTab] = useState<'music' | 'art'>('music');

  const { items: musicItems, loading: musicLoading, refetch: refetchMusic } = useContent({ type: 'music', userId: user?.id });
  const { items: artItems, loading: artLoading, refetch: refetchArt } = useContent({ type: 'art', userId: user?.id });

  const [stats, setStats] = useState({ likes: 0, subscribers: 0, uploadsThisMonth: 0, featured: 0, tipsReceived: 0 });
  const [featBusy, setFeatBusy] = useState<string | null>(null);
  const [featMsg, setFeatMsg] = useState<string | null>(null);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [connectBusy, setConnectBusy] = useState(false);
  const [searchParams] = useSearchParams();


  const isProActive = !!(profile?.is_pro && (!profile.pro_until || new Date(profile.pro_until) > new Date()));

  useEffect(() => {
    const c = searchParams.get('connect');
    if (c === 'return') {
      (async () => {
        setPayoutMsg('Checking Stripe Connect status…');
        const { data, error } = await supabase.functions.invoke('connect-status', { body: {} });
        if (error || data?.error) {
          setPayoutMsg('Returned from Stripe. Status will update when Connect webhooks/secrets are live. Refresh shortly.');
        } else if (data?.payouts_enabled) {
          setPayoutMsg('Stripe Express ready — you can request payouts.');
        } else if (data?.details_submitted) {
          setPayoutMsg('Details submitted — Stripe may still be verifying. Payouts unlock when enabled.');
        } else {
          setPayoutMsg('Onboarding incomplete — continue Connect when you can.');
        }
        await refreshProfile();
      })();
    }
    if (c === 'refresh') {
      setPayoutMsg('Onboarding link expired. Start Connect again.');
    }
  }, [searchParams, refreshProfile]);


  useEffect(() => {
    if (!user) return;
    (async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const contentIds = [...musicItems, ...artItems].map((i) => i.id);
      let likes = 0;
      if (contentIds.length) {
        const { count } = await supabase.from('likes').select('id', { count: 'exact', head: true }).in('content_id', contentIds);
        likes = count || 0;
      }
      const { count: subs } = await supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('subscribed_to', user.id);
      const { count: monthUp } = await supabase.from('content').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart.toISOString());
      const featured = [...musicItems, ...artItems].filter((i) => i.is_featured).length;
      const { data: tipRows } = await supabase.from('tips').select('artist_amount_cents').eq('to_user_id', user.id).eq('status', 'completed');
      const tipsReceived = (tipRows || []).reduce((s, r) => s + (r.artist_amount_cents || 0), 0);
      setStats({
        likes,
        subscribers: subs || 0,
        uploadsThisMonth: monthUp || 0,
        featured,
        tipsReceived,
      });
    })();
  }, [user, musicItems, artItems]);

  const toggleFeature = async (contentId: string, currently: boolean) => {
    if (!isProActive) {
      setFeatMsg('Artist Pro is required to feature works.');
      return;
    }
    setFeatBusy(contentId);
    setFeatMsg(null);
    const { error } = await supabase.rpc('set_content_featured', {
      p_content_id: contentId,
      p_featured: !currently,
    });
    setFeatBusy(null);
    if (error) {
      setFeatMsg(error.message);
      return;
    }
    await refetchMusic();
    await refetchArt();
    setFeatMsg(!currently ? 'Work featured for 30 days.' : 'Feature removed.');
  };

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio);
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Avatar must be under 5MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSaveError('Avatar must be JPG, PNG, or WebP.');
      return;
    }

    setUploadingAvatar(true);
    setSaveError(null);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) {
      setSaveError(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    if (displayName.trim().length < 2) {
      setSaveError('Display name must be at least 2 characters.');
      setSaving(false);
      return;
    }

    const { error } = await updateProfile({
      display_name: displayName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl || null,
    });

    if (error) {
      setSaveError(error);
    } else {
      setEditing(false);
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleToggleArtist = async () => {
    if (!profile) return;
    await updateProfile({ is_artist: !profile.is_artist });
    await refreshProfile();
  };


  const startConnect = async () => {
    setConnectBusy(true);
    setPayoutMsg(null);
    const { data, error } = await supabase.functions.invoke('connect-onboard', { body: {} });
    setConnectBusy(false);
    if (error || data?.error) {
      setPayoutMsg(
        'Stripe Connect is not fully configured yet (deploy connect-onboard + STRIPE_SECRET_KEY). You can still receive tip balance on Kreatif.',
      );
      return;
    }
    if (data?.url) window.location.href = data.url as string;
  };

  const requestPayout = async () => {
    setPayoutBusy(true);
    setPayoutMsg(null);
    const { data, error } = await supabase.functions.invoke('process-payout', { body: {} });
    setPayoutBusy(false);
    if (error || data?.error) {
      setPayoutMsg(
        error?.message?.includes('Edge Function') || error?.message?.includes('Failed')
          ? 'Payout service unavailable until Stripe Connect functions are deployed. Your tip balance stays on your profile.'
          : (data?.error || error?.message || 'Payout failed'),
      );
      return;
    }
    setPayoutMsg(`Payout submitted (${data?.transfer_id || 'ok'}). Funds go to your Stripe Express account.`);
    await refreshProfile();
  };

  if (!profile) return <LoadingState className="min-h-screen" />;

  const items = tab === 'music' ? musicItems : artItems;
  const itemsLoading = tab === 'music' ? musicLoading : artLoading;

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      <div className="h-32 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Profile header */}
        <div className="-mt-12 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-neutral-950 bg-neutral-800">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-neutral-300">{getInitials(profile.display_name)}</span>
              )}
            </div>
            {editing && (
              <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-neutral-950 bg-neutral-700 hover:bg-neutral-600">
                {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <Camera className="h-3.5 w-3.5 text-white" />}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
              </label>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-white">{profile.display_name}</h1>
            <p className="text-sm text-neutral-500">{profile.email}</p>
            <div className="mt-1 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              <div className="mb-6">
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-300 hover:border-white/30 hover:text-white"
          >
            My collections
          </Link>
        </div>

        {profile.is_artist && (
                <span className="inline-block rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-400">
                  Artist Mode
                </span>
              )}
              {isProActive && (
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-200">
                  <BadgeCheck className="h-3 w-3" /> Pro
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800"
            >
              {editing ? 'Cancel' : 'Edit profile'}
            </button>
            <button
              onClick={handleToggleArtist}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                profile.is_artist
                  ? 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90',
              )}
            >
              {profile.is_artist ? 'Turn off Artist Mode' : 'Turn on Artist Mode'}
            </button>
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            {saveError && (
              <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm text-red-300">{saveError}</p>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-200 focus:border-neutral-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Tell people about yourself..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
                />
                <p className="mt-1 text-xs text-neutral-500">{bio.length}/500</p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-neutral-900 hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </div>
        )}

        {/* Bio display */}
        {!editing && profile.bio && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400">{profile.bio}</p>
        )}

        {/* Upload CTA */}
        
        {profile.is_artist && (
          <div className="mb-8 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    {isProActive ? 'Artist Pro active' : 'Artist Pro'}
                    {isProActive && profile.pro_until ? (
                      <span className="ml-2 text-xs font-normal text-neutral-500">
                        until {new Date(profile.pro_until).toLocaleDateString()}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {`Tip balance: $${((profile.tip_balance_cents || 0) / 100).toFixed(2)} · Platform fee on tips is 10%`}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Uploads this month: {stats.uploadsThisMonth}
                    {isProActive ? ' · Pro (no free-tier cap)' : ` / ${FREE_UPLOADS_PER_MONTH} free limit`}
                  </p>
                </div>
                <Link
                  to="/pro"
                  className="rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-100 hover:bg-orange-500/20"
                >
                  {isProActive ? 'Manage Pro' : 'Go Pro · $9.90/mo'}
                </Link>
              </div>
            </div>

            
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                <Banknote className="h-4 w-4 text-orange-300/90" /> Tips &amp; payouts
              </div>
              <p className="text-xs text-neutral-500">
                Fans tip the platform; you are credited <span className="text-neutral-300">90%</span> after payment clears.
                Connect Stripe Express to withdraw to your bank.
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                ${((profile.tip_balance_cents || 0) / 100).toFixed(2)}
                <span className="ml-2 text-xs font-normal text-neutral-500">available</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!profile.payouts_enabled ? (
                  <button
                    type="button"
                    disabled={connectBusy}
                    onClick={startConnect}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
                  >
                    {connectBusy ? 'Opening Stripe…' : profile.stripe_account_id ? 'Continue Stripe setup' : 'Connect Stripe Express'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={payoutBusy || (profile.tip_balance_cents || 0) < 500}
                    onClick={requestPayout}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
                  >
                    {payoutBusy ? 'Processing…' : 'Request payout'}
                  </button>
                )}
              </div>
              {profile.payouts_enabled && (
                <p className="mt-2 text-[11px] text-emerald-400/90">Payouts enabled on Stripe Express</p>
              )}
              {payoutMsg && <p className="mt-2 text-xs text-neutral-400">{payoutMsg}</p>}
              <p className="mt-2 text-[11px] text-neutral-600">Minimum payout $5.00. Stripe must be configured on the server for transfers.</p>
            </div>

            {isProActive && (
              <div className="rounded-2xl border border-orange-400/20 bg-orange-500/[0.06] p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-orange-100">
                  <BarChart3 className="h-4 w-4" /> Pro analytics
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    ['Likes on your works', stats.likes],
                    ['Subscribers', stats.subscribers],
                    ['Uploads (month)', stats.uploadsThisMonth],
                    ['Featured active', stats.featured],
                    ['Tips earned', `$${(stats.tipsReceived / 100).toFixed(2)}`],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
                      <p className="text-lg font-semibold text-white">{val}</p>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</p>
                    </div>
                  ))}
                </div>
                {featMsg && <p className="mt-3 text-xs text-neutral-400">{featMsg}</p>}
                <p className="mt-3 text-[11px] text-neutral-500">
                  Feature up to 3 works at a time (30 days each). Use the star on each of your cards below.
                </p>
              </div>
            )}
          </div>
        )}

        {!profile.is_artist && (
          <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
            <p className="text-sm text-neutral-400">Want to share your work? Turn on Artist Mode to start uploading.</p>
          </div>
        )}

        {profile.is_artist && (
          <div className="mt-6">
            <Link
              to="/upload"
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              <Upload className="h-4 w-4" /> Upload new work
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-neutral-800">
          <button
            onClick={() => setTab('music')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === 'music' ? 'border-orange-500 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200',
            )}
          >
            <Music className="h-4 w-4" /> Music ({musicItems.length})
          </button>
          <button
            onClick={() => setTab('art')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === 'art' ? 'border-pink-500 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200',
            )}
          >
            <Image className="h-4 w-4" /> Art ({artItems.length})
          </button>
        </div>

        {/* Content grid */}
        <div className="mt-6">
          {itemsLoading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <EmptyState
              title={`No ${tab} uploaded yet`}
              message="Your uploads will appear here."
              action={profile.is_artist ? <Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">Upload</Link> : undefined}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <div key={item.id} className="relative">
                  <ContentCard item={item} />
                  {isProActive && (
                    <button
                      type="button"
                      disabled={featBusy === item.id}
                      onClick={() => toggleFeature(item.id, !!item.is_featured)}
                      className={cn(
                        'absolute right-2 top-2 z-40 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md transition-colors',
                        item.is_featured
                          ? 'border-amber-400/50 bg-amber-500/30 text-amber-50'
                          : 'border-white/20 bg-black/50 text-white/90 hover:border-amber-400/40 hover:bg-amber-500/20',
                      )}
                      title={item.is_featured ? 'Remove feature' : 'Feature this work'}
                    >
                      <Star className={cn('h-3 w-3', item.is_featured && 'fill-current')} />
                      {featBusy === item.id ? '…' : item.is_featured ? 'Featured' : 'Feature'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useContent } from '@/hooks/useContent';
import { ContentCard } from '@/components/ContentCard';
import { LoadingState, EmptyState } from '@/components/States';
import { getInitials, cn } from '@/lib/utils';
import { Music, Image, Upload, LogOut, Camera, Loader2, Check } from 'lucide-react';

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

  const { items: musicItems, loading: musicLoading } = useContent({ type: 'music', userId: user?.id });
  const { items: artItems, loading: artLoading } = useContent({ type: 'art', userId: user?.id });

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
            {profile.is_artist && (
              <span className="mt-1 inline-block rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-400">
                Artist Mode
              </span>
            )}
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
                <ContentCard key={item.id} item={item} />
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

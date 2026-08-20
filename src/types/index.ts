export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  is_artist: boolean;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: string;
  name: string;
  type: 'music' | 'art';
  sort_order: number;
}

export interface ContentItem {
  id: string;
  user_id: string;
  type: 'music' | 'art';
  title: string;
  description: string;
  genre_id: string | null;
  file_url: string;
  cover_image_url: string | null;
  duration_sec: number | null;
  visibility: 'visible' | 'hidden';
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  genre?: Genre | null;
  like_count?: number;
  is_liked?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  content_id: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  subscriber: string;
  subscribed_to: string;
  created_at: string;
}

export interface OriginalityAttestation {
  id: string;
  user_id: string;
  content_id: string;
  attested_text: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  content_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  profiles?: Profile;
  content?: ContentItem;
}

export interface ContentWithRelations extends ContentItem {
  profiles: Profile;
  genre: Genre | null;
}

export const ORIGINALITY_ATTESTATION_TEXT =
  'I confirm this is my own original work or I hold rights to upload it.';

export const REPORT_REASONS = [
  'Copyright infringement',
  'Inappropriate content',
  'Spam or misleading',
  'Harassment or hate speech',
  'Other',
] as const;

export const PAGE_SIZE = 12;

-- Artist Pro + Tips (10% platform fee)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_until timestamptz,
  ADD COLUMN IF NOT EXISTS tip_balance_cents integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id uuid REFERENCES content(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 100),
  platform_fee_cents integer NOT NULL CHECK (platform_fee_cents >= 0),
  artist_amount_cents integer NOT NULL CHECK (artist_amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tips_to_user ON tips (to_user_id);

ALTER TABLE content
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

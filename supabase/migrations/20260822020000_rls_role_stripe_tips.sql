-- Artists-only content insert, profile.role, pending tips until Stripe payment
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
-- check constraint may already exist from prior apply

UPDATE profiles SET role = 'admin' WHERE email = 'admin@kreatif.app';

ALTER TABLE tips ADD COLUMN IF NOT EXISTS stripe_session_id text;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS stripe_payment_intent text;

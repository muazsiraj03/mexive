-- Add payment information columns to credit_pack_purchases
ALTER TABLE public.credit_pack_purchases
ADD COLUMN IF NOT EXISTS sender_name text,
ADD COLUMN IF NOT EXISTS sender_account text,
ADD COLUMN IF NOT EXISTS transaction_id text,
ADD COLUMN IF NOT EXISTS payment_date date,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Add pack_name for easier display
ALTER TABLE public.credit_pack_purchases
ADD COLUMN IF NOT EXISTS pack_name text;
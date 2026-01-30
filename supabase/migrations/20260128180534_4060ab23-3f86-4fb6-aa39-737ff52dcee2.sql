-- Create credit_pack_purchases table for one-time credit purchases
CREATE TABLE public.credit_pack_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  credits INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_pack_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON public.credit_pack_purchases
FOR SELECT USING (auth.uid() = user_id);

-- Allow users to request subscription (insert with pending status)
CREATE POLICY "Users can request subscription" ON public.subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Allow users to cancel their own subscription
CREATE POLICY "Users can cancel own subscription" ON public.subscriptions
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
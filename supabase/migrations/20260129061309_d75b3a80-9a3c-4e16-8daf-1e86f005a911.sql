-- Create credit_packs table for admin-configurable credit pack options
CREATE TABLE public.credit_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  credits integer NOT NULL,
  price_cents integer NOT NULL,
  bonus_credits integer DEFAULT 0,
  is_popular boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active credit packs
CREATE POLICY "Anyone can view active credit packs"
ON public.credit_packs
FOR SELECT
USING (is_active = true);

-- Admins can manage credit packs
CREATE POLICY "Admins can manage credit packs"
ON public.credit_packs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default credit packs
INSERT INTO public.credit_packs (name, credits, price_cents, bonus_credits, is_popular, sort_order) VALUES
  ('Starter Pack', 50, 999, 0, false, 1),
  ('Value Pack', 150, 2499, 25, true, 2),
  ('Pro Pack', 500, 6999, 100, false, 3),
  ('Mega Pack', 1000, 11999, 250, false, 4);

-- Remove billing_period from subscriptions as we're replacing annual with credit packs
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS billing_period;
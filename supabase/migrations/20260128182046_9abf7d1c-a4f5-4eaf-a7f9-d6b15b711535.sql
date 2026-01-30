-- Create pricing_config table for dynamic pricing
CREATE TABLE public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  credits INTEGER NOT NULL DEFAULT 0,
  period TEXT DEFAULT '/month',
  features TEXT[] NOT NULL DEFAULT '{}',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read pricing (public data)
CREATE POLICY "Anyone can view pricing" ON public.pricing_config
FOR SELECT USING (true);

-- Only admins can modify pricing
CREATE POLICY "Admins can manage pricing" ON public.pricing_config
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default pricing
INSERT INTO public.pricing_config (plan_name, display_name, price_cents, credits, period, features, is_popular, sort_order)
VALUES 
  ('free', 'Free', 0, 5, '', ARRAY['5 credits included', 'AI image analysis', 'All 3 marketplaces', 'CSV export'], false, 1),
  ('pro', 'Pro', 1900, 100, '/month', ARRAY['100 credits/month', 'Everything in Free', 'Bulk processing (10 images)', 'Priority support', 'Rollover unused credits'], true, 2),
  ('enterprise', 'Enterprise', 4900, 500, '/month', ARRAY['500 credits/month', 'Everything in Pro', 'API access', 'Dedicated support', 'Custom integrations'], false, 3);

-- Add trigger for updated_at
CREATE TRIGGER update_pricing_config_updated_at
BEFORE UPDATE ON public.pricing_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
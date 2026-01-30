-- Create credit_tiers table for dynamic credit tier configuration
CREATE TABLE public.credit_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL,
  credits integer NOT NULL,
  price_cents integer NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add unique constraint to prevent duplicate credit amounts per plan
ALTER TABLE public.credit_tiers ADD CONSTRAINT unique_plan_credits UNIQUE (plan_name, credits);

-- Enable RLS
ALTER TABLE public.credit_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active credit tiers (for pricing display)
CREATE POLICY "Anyone can view active credit tiers"
ON public.credit_tiers
FOR SELECT
USING (is_active = true);

-- Admins can manage credit tiers
CREATE POLICY "Admins can manage credit tiers"
ON public.credit_tiers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_credit_tiers_updated_at
BEFORE UPDATE ON public.credit_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default credit tiers for Pro plan
INSERT INTO public.credit_tiers (plan_name, credits, price_cents, sort_order) VALUES
('pro', 100, 1900, 1),
('pro', 200, 2900, 2),
('pro', 400, 4900, 3),
('pro', 800, 7900, 4),
('pro', 1200, 9900, 5);

-- Insert default credit tiers for Enterprise plan
INSERT INTO public.credit_tiers (plan_name, credits, price_cents, sort_order) VALUES
('enterprise', 500, 4900, 1),
('enterprise', 1000, 8900, 2),
('enterprise', 2000, 15900, 3),
('enterprise', 3000, 21900, 4),
('enterprise', 5000, 34900, 5);
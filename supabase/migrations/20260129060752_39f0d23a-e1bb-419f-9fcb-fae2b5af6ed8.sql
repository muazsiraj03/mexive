-- Add billing_period column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN billing_period text DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual'));
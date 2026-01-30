-- Add is_unlimited flag to pricing_config table
ALTER TABLE public.pricing_config 
ADD COLUMN is_unlimited boolean NOT NULL DEFAULT false;

-- Update the existing unlimited plan if it exists
UPDATE public.pricing_config 
SET is_unlimited = true 
WHERE plan_name = 'unlimited';
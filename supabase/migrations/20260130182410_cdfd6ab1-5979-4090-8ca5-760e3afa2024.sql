-- Add tools_access column to pricing_config for plan-wise tool restrictions
ALTER TABLE public.pricing_config 
ADD COLUMN IF NOT EXISTS tools_access text[] NOT NULL DEFAULT ARRAY['metadata-generator', 'image-to-prompt', 'file-reviewer']::text[];

-- Add daily_credit_reset column to track if plan has daily credit renewal
ALTER TABLE public.pricing_config 
ADD COLUMN IF NOT EXISTS daily_credit_reset boolean NOT NULL DEFAULT false;

-- Update free plan to have daily credit reset
UPDATE public.pricing_config 
SET daily_credit_reset = true 
WHERE plan_name = 'free';

-- Add last_credit_reset column to profiles to track when credits were last reset
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_credit_reset timestamp with time zone DEFAULT now();
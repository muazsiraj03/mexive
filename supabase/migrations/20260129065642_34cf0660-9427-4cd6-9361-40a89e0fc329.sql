-- Add unlimited credits flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN has_unlimited_credits BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.has_unlimited_credits IS 'When true, user has unlimited credits and bypasses credit deduction';
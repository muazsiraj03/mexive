-- Remove per-plan first_signup_credits column since we're using global settings
ALTER TABLE public.pricing_config DROP COLUMN IF EXISTS first_signup_credits;

-- Insert global credit settings into system_settings
INSERT INTO public.system_settings (key, value) VALUES 
  ('first_signup_credits', '10'),
  ('daily_renewable_credits', '2')
ON CONFLICT (key) DO NOTHING;

-- Update handle_new_user function to use global system_settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    first_signup_credits_val integer;
    daily_credits_val integer;
BEGIN
    -- Get first signup credits from system_settings
    SELECT COALESCE(value::integer, 10) INTO first_signup_credits_val
    FROM public.system_settings
    WHERE key = 'first_signup_credits';
    
    -- Get daily renewable credits from system_settings
    SELECT COALESCE(value::integer, 2) INTO daily_credits_val
    FROM public.system_settings
    WHERE key = 'daily_renewable_credits';
    
    -- Default values if settings don't exist
    IF first_signup_credits_val IS NULL THEN
        first_signup_credits_val := 10;
    END IF;
    
    IF daily_credits_val IS NULL THEN
        daily_credits_val := 2;
    END IF;

    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create free subscription with first_signup_credits
    -- credits_total stores the daily renewable amount for later resets
    INSERT INTO public.subscriptions (user_id, plan, credits_remaining, credits_total, started_at)
    VALUES (NEW.id, 'free', first_signup_credits_val, daily_credits_val, now());
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$function$;
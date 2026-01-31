-- Add first_signup_credits column to pricing_config
ALTER TABLE public.pricing_config 
ADD COLUMN first_signup_credits integer NOT NULL DEFAULT 0;

-- Update existing plans: set first_signup_credits equal to credits for backward compatibility
UPDATE public.pricing_config SET first_signup_credits = credits;

-- Update handle_new_user function to use first_signup_credits for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    plan_config RECORD;
BEGIN
    -- Get plan config for free plan
    SELECT credits, first_signup_credits INTO plan_config
    FROM public.pricing_config
    WHERE plan_name = 'free' AND is_active = true
    LIMIT 1;
    
    -- Default to 2 if no config found
    IF plan_config IS NULL THEN
        plan_config.first_signup_credits := 2;
        plan_config.credits := 2;
    END IF;

    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create free subscription with first_signup_credits (one-time initial credits)
    -- credits_total stores the daily renewable amount for later resets
    INSERT INTO public.subscriptions (user_id, plan, credits_remaining, credits_total, started_at)
    VALUES (NEW.id, 'free', plan_config.first_signup_credits, plan_config.credits, now());
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$function$;
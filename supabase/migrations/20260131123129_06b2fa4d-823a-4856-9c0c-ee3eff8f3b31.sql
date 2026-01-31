-- Update handle_new_user function to use credits from pricing_config
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    free_plan_credits integer;
BEGIN
    -- Get credits from pricing_config for free plan
    SELECT credits INTO free_plan_credits
    FROM public.pricing_config
    WHERE plan_name = 'free' AND is_active = true
    LIMIT 1;
    
    -- Default to 2 if no config found
    IF free_plan_credits IS NULL THEN
        free_plan_credits := 2;
    END IF;

    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create free subscription with dynamic credits from pricing_config
    INSERT INTO public.subscriptions (user_id, plan, credits_remaining, credits_total, started_at)
    VALUES (NEW.id, 'free', free_plan_credits, free_plan_credits, now());
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$function$;
-- Create referral_codes table
CREATE TABLE public.referral_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.referrals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL,
    referee_id UUID NOT NULL,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    referrer_reward_credits INTEGER NOT NULL DEFAULT 0,
    referee_reward_credits INTEGER NOT NULL DEFAULT 0,
    rewarded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_settings table (singleton for admin config)
CREATE TABLE public.referral_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_reward_credits INTEGER NOT NULL DEFAULT 10,
    referee_reward_credits INTEGER NOT NULL DEFAULT 5,
    reward_trigger TEXT NOT NULL DEFAULT 'signup',
    max_referrals_per_user INTEGER,
    cap_period TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default referral settings
INSERT INTO public.referral_settings (referrer_reward_credits, referee_reward_credits, reward_trigger, is_active)
VALUES (10, 5, 'signup', true);

-- Enable RLS on all tables
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view own referral code"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own referral code"
ON public.referral_codes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all referral codes"
ON public.referral_codes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals where they are referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for referral_settings
CREATE POLICY "Referral settings viewable by everyone"
ON public.referral_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage referral settings"
ON public.referral_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on referral_settings
CREATE TRIGGER update_referral_settings_updated_at
BEFORE UPDATE ON public.referral_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID, p_full_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base code from first 4 chars of name (uppercase) + 4 random digits
    base_code := UPPER(LEFT(REGEXP_REPLACE(COALESCE(p_full_name, 'USER'), '[^a-zA-Z]', '', 'g'), 4));
    IF LENGTH(base_code) < 4 THEN
        base_code := base_code || REPEAT('X', 4 - LENGTH(base_code));
    END IF;
    
    -- Add 4 random digits
    final_code := base_code || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Keep trying until we find a unique code
    WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = final_code) LOOP
        counter := counter + 1;
        final_code := base_code || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        IF counter > 100 THEN
            -- Fallback to UUID-based code
            final_code := UPPER(LEFT(REPLACE(gen_random_uuid()::TEXT, '-', ''), 8));
            EXIT;
        END IF;
    END LOOP;
    
    RETURN final_code;
END;
$$;

-- Update handle_new_user to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    first_signup_credits_val integer;
    daily_credits_val integer;
    new_referral_code TEXT;
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
    INSERT INTO public.subscriptions (user_id, plan, credits_remaining, credits_total, started_at)
    VALUES (NEW.id, 'free', first_signup_credits_val, daily_credits_val, now());
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Generate and insert referral code
    new_referral_code := public.generate_referral_code(
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (NEW.id, new_referral_code);
    
    RETURN NEW;
END;
$$;
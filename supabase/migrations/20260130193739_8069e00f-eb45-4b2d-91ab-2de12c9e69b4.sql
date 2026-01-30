-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- User profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Pricing configuration table
CREATE TABLE public.pricing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0,
    credits INTEGER NOT NULL DEFAULT 0,
    period TEXT NOT NULL DEFAULT 'month',
    features TEXT[] NOT NULL DEFAULT '{}',
    is_popular BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_unlimited BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    tools_access TEXT[] NOT NULL DEFAULT '{}',
    daily_credit_reset BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Credit tiers table (for plan upgrades with different credit amounts)
CREATE TABLE public.credit_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_tiers ENABLE ROW LEVEL SECURITY;

-- Credit packs table (one-time purchases)
CREATE TABLE public.credit_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    bonus_credits INTEGER NOT NULL DEFAULT 0,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

-- Credit pack purchases table
CREATE TABLE public.credit_pack_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pack_id UUID REFERENCES public.credit_packs(id) ON DELETE SET NULL,
    credits INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_pack_purchases ENABLE ROW LEVEL SECURITY;

-- User subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_name TEXT NOT NULL DEFAULT 'free',
    credits_remaining INTEGER NOT NULL DEFAULT 0,
    credits_total INTEGER NOT NULL DEFAULT 0,
    bonus_credits INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active',
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Prompt history table
CREATE TABLE public.prompt_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    style TEXT,
    detail_level TEXT,
    art_style TEXT,
    dominant_colors TEXT[],
    aspect_ratio TEXT,
    training_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- File reviews table
CREATE TABLE public.file_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    image_url TEXT,
    overall_score INTEGER NOT NULL DEFAULT 0,
    verdict TEXT NOT NULL DEFAULT 'pending',
    issues JSONB NOT NULL DEFAULT '[]',
    suggestions TEXT[] NOT NULL DEFAULT '{}',
    marketplace_notes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_reviews ENABLE ROW LEVEL SECURITY;

-- Training presets table
CREATE TABLE public.training_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    preferences JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_presets ENABLE ROW LEVEL SECURITY;

-- Metadata generations table
CREATE TABLE public.metadata_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    batch_id UUID,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    image_url TEXT,
    title TEXT,
    description TEXT,
    keywords TEXT[],
    marketplace TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metadata_generations ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- System settings table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- File reviewer config table
CREATE TABLE public.file_reviewer_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_reviewer_config ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pricing config policies (public read, admin write)
CREATE POLICY "Pricing config is viewable by everyone" ON public.pricing_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage pricing config" ON public.pricing_config
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Credit tiers policies (public read, admin write)
CREATE POLICY "Credit tiers are viewable by everyone" ON public.credit_tiers
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage credit tiers" ON public.credit_tiers
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Credit packs policies (public read, admin write)
CREATE POLICY "Credit packs are viewable by everyone" ON public.credit_packs
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage credit packs" ON public.credit_packs
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Credit pack purchases policies
CREATE POLICY "Users can view own purchases" ON public.credit_pack_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases" ON public.credit_pack_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" ON public.credit_pack_purchases
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Prompt history policies
CREATE POLICY "Users can view own prompt history" ON public.prompt_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompt history" ON public.prompt_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt history" ON public.prompt_history
    FOR DELETE USING (auth.uid() = user_id);

-- File reviews policies
CREATE POLICY "Users can view own file reviews" ON public.file_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own file reviews" ON public.file_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own file reviews" ON public.file_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Training presets policies
CREATE POLICY "Users can view own presets" ON public.training_presets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own presets" ON public.training_presets
    FOR ALL USING (auth.uid() = user_id);

-- Metadata generations policies
CREATE POLICY "Users can view own generations" ON public.metadata_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations" ON public.metadata_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON public.metadata_generations
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- System settings policies (public read, admin write)
CREATE POLICY "System settings are viewable by everyone" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage system settings" ON public.system_settings
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- File reviewer config policies (public read, admin write)
CREATE POLICY "File reviewer config is viewable by everyone" ON public.file_reviewer_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage file reviewer config" ON public.file_reviewer_config
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ FUNCTIONS & TRIGGERS ============

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_config_updated_at
    BEFORE UPDATE ON public.pricing_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_presets_updated_at
    BEFORE UPDATE ON public.training_presets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_reviewer_config_updated_at
    BEFORE UPDATE ON public.file_reviewer_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile and subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create free subscription
    INSERT INTO public.subscriptions (user_id, plan_name, credits_remaining, credits_total)
    VALUES (NEW.id, 'free', 10, 10);
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED DATA ============

-- Insert default system settings
INSERT INTO public.system_settings (key, value) VALUES
    ('enable_credit_packs', 'true'),
    ('enable_new_signups', 'true'),
    ('maintenance_mode', 'false'),
    ('logo_light_mode', ''),
    ('logo_dark_mode', ''),
    ('favicon_url', ''),
    ('logo_size', 'medium'),
    ('logo_alignment', 'left'),
    ('app_name', 'MetaGen'),
    ('browser_title', 'MetaGen - AI Metadata Generator'),
    ('footer_text', '© 2025 MetaGen. All rights reserved.'),
    ('support_email', 'support@metagen.com'),
    ('meta_description', 'Generate optimized metadata for your stock images and videos with AI'),
    ('meta_keywords', 'metadata generator, stock photography, AI, keywords, SEO'),
    ('og_image_url', '');

-- Insert default pricing plans
INSERT INTO public.pricing_config (plan_name, display_name, price_cents, credits, period, features, is_popular, sort_order, tools_access, daily_credit_reset) VALUES
    ('free', 'Free', 0, 10, 'month', ARRAY['10 credits/day', 'Basic metadata generation', 'Standard support'], false, 0, ARRAY['metadata-generator'], true),
    ('starter', 'Starter', 999, 100, 'month', ARRAY['100 credits/month', 'All tools access', 'Priority support', 'Batch processing'], false, 1, ARRAY['metadata-generator', 'image-to-prompt', 'file-reviewer'], false),
    ('pro', 'Pro', 2999, 500, 'month', ARRAY['500 credits/month', 'All tools access', 'Priority support', 'Batch processing', 'Training presets'], true, 2, ARRAY['metadata-generator', 'image-to-prompt', 'file-reviewer'], false),
    ('unlimited', 'Unlimited', 9999, 0, 'month', ARRAY['Unlimited credits', 'All tools access', 'Priority support', 'Batch processing', 'Training presets', 'API access'], false, 3, ARRAY['metadata-generator', 'image-to-prompt', 'file-reviewer'], false);

-- Update unlimited plan
UPDATE public.pricing_config SET is_unlimited = true WHERE plan_name = 'unlimited';

-- Insert default credit tiers
INSERT INTO public.credit_tiers (plan_name, credits, price_cents, sort_order) VALUES
    ('starter', 100, 999, 0),
    ('starter', 200, 1799, 1),
    ('starter', 300, 2499, 2),
    ('pro', 500, 2999, 0),
    ('pro', 1000, 4999, 1),
    ('pro', 2000, 8999, 2);

-- Insert default credit packs
INSERT INTO public.credit_packs (name, credits, price_cents, bonus_credits, is_popular, sort_order) VALUES
    ('Starter Pack', 50, 499, 0, false, 0),
    ('Value Pack', 150, 999, 25, true, 1),
    ('Pro Pack', 500, 2499, 100, false, 2),
    ('Enterprise Pack', 2000, 7999, 500, false, 3);
-- Add missing columns to notifications table
ALTER TABLE public.notifications 
    ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create user_notification_reads table for tracking read status of global notifications
CREATE TABLE public.user_notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, notification_id)
);

ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- Create prompt_training_preferences table
CREATE TABLE public.prompt_training_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    preferred_tone TEXT NOT NULL DEFAULT 'neutral',
    preferred_length TEXT NOT NULL DEFAULT 'medium',
    include_keywords TEXT[] NOT NULL DEFAULT '{}',
    exclude_keywords TEXT[] NOT NULL DEFAULT '{}',
    custom_instructions TEXT,
    training_strength INTEGER NOT NULL DEFAULT 75,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_training_preferences ENABLE ROW LEVEL SECURITY;

-- Create prompt_examples table
CREATE TABLE public.prompt_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT,
    prompt_text TEXT NOT NULL,
    style TEXT NOT NULL DEFAULT 'photographic',
    is_positive BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_examples ENABLE ROW LEVEL SECURITY;

-- Create prompt_feedback table
CREATE TABLE public.prompt_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_text TEXT NOT NULL,
    style TEXT NOT NULL,
    detail_level TEXT NOT NULL,
    rating INTEGER NOT NULL,
    feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_feedback ENABLE ROW LEVEL SECURITY;

-- Modify subscriptions table to match expected structure
ALTER TABLE public.subscriptions 
    RENAME COLUMN plan_name TO plan;

ALTER TABLE public.subscriptions 
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- RLS Policies for user_notification_reads
CREATE POLICY "Users can view own notification reads" ON public.user_notification_reads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification reads" ON public.user_notification_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for prompt_training_preferences
CREATE POLICY "Users can view own training preferences" ON public.prompt_training_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own training preferences" ON public.prompt_training_preferences
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for prompt_examples
CREATE POLICY "Users can view own prompt examples" ON public.prompt_examples
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prompt examples" ON public.prompt_examples
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for prompt_feedback
CREATE POLICY "Users can view own prompt feedback" ON public.prompt_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prompt feedback" ON public.prompt_feedback
    FOR ALL USING (auth.uid() = user_id);

-- Update notifications policies for global notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own or global notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id OR is_global = true);

-- Trigger for prompt_training_preferences updated_at
CREATE TRIGGER update_prompt_training_preferences_updated_at
    BEFORE UPDATE ON public.prompt_training_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to use new column name
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
    INSERT INTO public.subscriptions (user_id, plan, credits_remaining, credits_total, started_at)
    VALUES (NEW.id, 'free', 10, 10, now());
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Table for storing user's prompt training preferences
CREATE TABLE public.prompt_training_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_tone TEXT DEFAULT 'neutral',
    preferred_length TEXT DEFAULT 'medium',
    include_keywords TEXT[] DEFAULT '{}',
    exclude_keywords TEXT[] DEFAULT '{}',
    custom_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Table for storing user's prompt examples (reference prompts they like)
CREATE TABLE public.prompt_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT,
    prompt_text TEXT NOT NULL,
    style TEXT DEFAULT 'general',
    is_positive BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for storing prompt feedback (thumbs up/down on generations)
CREATE TABLE public.prompt_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    style TEXT DEFAULT 'general',
    detail_level TEXT DEFAULT 'detailed',
    rating INTEGER CHECK (rating IN (-1, 1)),
    feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_training_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompt_training_preferences
CREATE POLICY "Users can view own preferences"
ON public.prompt_training_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.prompt_training_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.prompt_training_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for prompt_examples
CREATE POLICY "Users can view own examples"
ON public.prompt_examples FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own examples"
ON public.prompt_examples FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own examples"
ON public.prompt_examples FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for prompt_feedback
CREATE POLICY "Users can view own feedback"
ON public.prompt_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
ON public.prompt_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_prompt_training_preferences_updated_at
BEFORE UPDATE ON public.prompt_training_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
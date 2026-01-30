-- Add training_strength to prompt_training_preferences
ALTER TABLE public.prompt_training_preferences
ADD COLUMN training_strength integer DEFAULT 75 CHECK (training_strength >= 0 AND training_strength <= 100);

-- Create prompt_history table
CREATE TABLE public.prompt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  style TEXT NOT NULL DEFAULT 'general',
  detail_level TEXT NOT NULL DEFAULT 'detailed',
  art_style TEXT,
  dominant_colors TEXT[],
  aspect_ratio TEXT,
  training_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on prompt_history
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompt_history
CREATE POLICY "Users can view own prompt history"
  ON public.prompt_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompt history"
  ON public.prompt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt history"
  ON public.prompt_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create training_presets table
CREATE TABLE public.training_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on training_presets
ALTER TABLE public.training_presets ENABLE ROW LEVEL SECURITY;

-- RLS policies for training_presets
CREATE POLICY "Users can view own presets"
  ON public.training_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets"
  ON public.training_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets"
  ON public.training_presets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets"
  ON public.training_presets FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_prompt_history_user_id ON public.prompt_history(user_id);
CREATE INDEX idx_prompt_history_created_at ON public.prompt_history(created_at DESC);
CREATE INDEX idx_training_presets_user_id ON public.training_presets(user_id);
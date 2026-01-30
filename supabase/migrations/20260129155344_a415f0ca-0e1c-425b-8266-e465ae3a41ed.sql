-- Create generation_batches table to group folder uploads
CREATE TABLE public.generation_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add batch_id column to generations table
ALTER TABLE public.generations
ADD COLUMN batch_id UUID REFERENCES public.generation_batches(id) ON DELETE SET NULL;

-- Create index for faster batch lookups
CREATE INDEX idx_generations_batch_id ON public.generations(batch_id);
CREATE INDEX idx_generation_batches_user_id ON public.generation_batches(user_id);

-- Enable RLS on generation_batches
ALTER TABLE public.generation_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for generation_batches
CREATE POLICY "Users can view own batches"
ON public.generation_batches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batches"
ON public.generation_batches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches"
ON public.generation_batches
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own batches"
ON public.generation_batches
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);